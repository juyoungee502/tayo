import { FEEDBACK_DELAY_HOURS } from "@/lib/constants";
import { requireAdmin, requireAuth, type ServerSupabaseClient } from "@/lib/queries/auth";
import type {
  AccountDeletionRequest,
  MemberStatus,
  PartyDetail,
  PartyListItem,
  PartyMember,
  Profile,
  Report,
  TaxiParty,
} from "@/types/database";

const ACTIVE_PARTY_STATUSES = ["recruiting", "full"] as const;
const FEEDBACK_ELIGIBLE_MEMBER_STATUSES: MemberStatus[] = ["joined", "completed"];

function getDateRange(date: string) {
  const start = new Date(`${date}T00:00:00+09:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function fetchProfilesMap(supabase: ServerSupabaseClient, ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, Profile>();
  }

  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);

  if (error) {
    throw new Error("프로필 목록을 불러오지 못했습니다.");
  }

  return new Map((data as Profile[]).map((profile) => [profile.id, profile]));
}

async function fetchPartyMembers(supabase: ServerSupabaseClient, partyIds: string[]) {
  if (partyIds.length === 0) {
    return [] as PartyMember[];
  }

  const { data, error } = await supabase.from("party_members").select("*").in("party_id", partyIds);

  if (error) {
    throw new Error("참여자 정보를 불러오지 못했습니다.");
  }

  return (data ?? []) as PartyMember[];
}

async function fetchActivePartyIdsForUser(
  supabase: ServerSupabaseClient,
  userId: string,
  excludePartyId?: string,
) {
  const { data: memberships, error: membershipError } = await supabase
    .from("party_members")
    .select("party_id")
    .eq("user_id", userId)
    .eq("status", "joined");

  if (membershipError) {
    throw new Error("현재 참여 중인 활성 택시팟을 확인하지 못했습니다.");
  }

  const candidatePartyIds = (memberships ?? [])
    .map((membership) => membership.party_id)
    .filter((partyId) => partyId && partyId !== excludePartyId);

  if (candidatePartyIds.length === 0) {
    return [] as string[];
  }

  const { data: activeParties, error: activePartyError } = await supabase
    .from("taxi_parties")
    .select("id")
    .in("id", candidatePartyIds)
    .in("status", [...ACTIVE_PARTY_STATUSES])
    .gt("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true });

  if (activePartyError) {
    throw new Error("활성 택시팟 상태를 불러오지 못했습니다.");
  }

  return (activeParties ?? []).map((party) => party.id);
}

async function fetchActivePartyId(supabase: ServerSupabaseClient, userId: string, excludePartyId?: string) {
  const activePartyIds = await fetchActivePartyIdsForUser(supabase, userId, excludePartyId);
  return activePartyIds[0] ?? null;
}

async function decoratePartyList(
  supabase: ServerSupabaseClient,
  parties: TaxiParty[],
  currentUserId: string,
) {
  const partyIds = parties.map((party) => party.id);
  const members = await fetchPartyMembers(supabase, partyIds);
  const profilesMap = await fetchProfilesMap(
    supabase,
    [...new Set(parties.map((party) => party.creator_id))],
  );
  const activePartyId = await fetchActivePartyId(supabase, currentUserId);
  const membersByPartyId = new Map<string, PartyMember[]>();

  members.forEach((member) => {
    const bucket = membersByPartyId.get(member.party_id) ?? [];
    bucket.push(member);
    membersByPartyId.set(member.party_id, bucket);
  });

  return parties.map((party) => {
    const partyMembers = membersByPartyId.get(party.id) ?? [];
    const joinedMembers = partyMembers.filter((member) => member.status === "joined");
    const myMembership = partyMembers.find((member) => member.user_id === currentUserId) ?? null;
    const joinedCount = joinedMembers.length;
    const seatsLeft = Math.max(party.capacity - joinedCount, 0);
    const isFuture = new Date(party.scheduled_at).getTime() > Date.now();
    const isJoinable =
      isFuture &&
      seatsLeft > 0 &&
      party.status !== "cancelled" &&
      party.status !== "completed" &&
      !myMembership &&
      (!activePartyId || activePartyId === party.id);

    return {
      ...party,
      creatorNickname: profilesMap.get(party.creator_id)?.nickname ?? "익명",
      joinedCount,
      seatsLeft,
      myMembershipStatus: (myMembership?.status as MemberStatus | undefined) ?? null,
      isJoinable,
    } satisfies PartyListItem;
  });
}

export async function getPendingFeedbackPartiesForCurrentUser() {
  const { supabase, user } = await requireAuth();
  const cutoff = new Date(Date.now() - FEEDBACK_DELAY_HOURS * 60 * 60 * 1000).toISOString();

  const { data: memberships, error: membershipError } = await supabase
    .from("party_members")
    .select("*")
    .eq("user_id", user.id)
    .in("status", FEEDBACK_ELIGIBLE_MEMBER_STATUSES);

  if (membershipError) {
    throw new Error("피드백 대상 파티를 확인하지 못했습니다.");
  }

  const partyIds = (memberships as PartyMember[]).map((membership) => membership.party_id);

  if (partyIds.length === 0) {
    return [] as TaxiParty[];
  }

  const { data: parties, error: partyError } = await supabase
    .from("taxi_parties")
    .select("*")
    .in("id", partyIds)
    .lte("scheduled_at", cutoff)
    .neq("status", "cancelled")
    .order("scheduled_at", { ascending: false });

  if (partyError) {
    throw new Error("피드백 대상 파티를 불러오지 못했습니다.");
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("party_id")
    .eq("reviewer_id", user.id)
    .in("party_id", partyIds);

  const reviewedPartyIds = new Set((reviews ?? []).map((review) => review.party_id));

  return ((parties ?? []) as TaxiParty[]).filter((party) => !reviewedPartyIds.has(party.id));
}

export async function getHomePageData() {
  const { supabase, user, profile } = await requireAuth();
  const pendingFeedbackParties = await getPendingFeedbackPartiesForCurrentUser();
  const activePartyIds = await fetchActivePartyIdsForUser(supabase, user.id);
  const { data: activeParties } = activePartyIds.length
    ? await supabase.from("taxi_parties").select("*").in("id", activePartyIds).order("scheduled_at")
    : { data: [] };

  const upcomingParty = ((activeParties ?? []) as TaxiParty[])
    .filter((party) => party.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] ?? null;

  const { data: partiesData, error } = await supabase
    .from("taxi_parties")
    .select("*")
    .neq("status", "cancelled")
    .order("scheduled_at", { ascending: true })
    .limit(6);

  if (error) {
    throw new Error("최근 택시팟을 불러오지 못했습니다.");
  }

  const recentParties = await decoratePartyList(supabase, (partiesData ?? []) as TaxiParty[], user.id);

  return {
    profile,
    upcomingParty,
    pendingFeedbackParties,
    recentParties,
  };
}

export async function getPartyList(filters: { q?: string; date?: string; availability?: string }) {
  const { supabase, user } = await requireAuth();
  let query = supabase
    .from("taxi_parties")
    .select("*")
    .neq("status", "cancelled")
    .order("scheduled_at", { ascending: true });

  if (filters.q) {
    const keyword = filters.q.replaceAll(",", " ").trim();
    query = query.or(`departure_place_name.ilike.%${keyword}%,departure_detail.ilike.%${keyword}%`);
  }

  if (filters.date) {
    const range = getDateRange(filters.date);
    query = query.gte("scheduled_at", range.start).lt("scheduled_at", range.end);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("택시팟 목록을 불러오지 못했습니다.");
  }

  const items = await decoratePartyList(supabase, (data ?? []) as TaxiParty[], user.id);

  if (filters.availability === "joinable") {
    return items.filter((item) => item.isJoinable);
  }

  return items;
}

export async function getPartyDetail(partyId: string): Promise<PartyDetail | null> {
  const { supabase, user } = await requireAuth();
  const { data: partyData, error } = await supabase
    .from("taxi_parties")
    .select("*")
    .eq("id", partyId)
    .maybeSingle();

  if (error) {
    throw new Error("택시팟 정보를 불러오지 못했습니다.");
  }

  if (!partyData) {
    return null;
  }

  const party = partyData as TaxiParty;
  const members = await fetchPartyMembers(supabase, [partyId]);
  const participantProfiles = await fetchProfilesMap(
    supabase,
    [...new Set([party.creator_id, ...members.map((member) => member.user_id)])],
  );
  const currentUserMembership = members.find((member) => member.user_id === user.id) ?? null;
  const joinedCount = members.filter((member) => member.status === "joined").length;
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("id")
    .eq("party_id", partyId)
    .eq("reviewer_id", user.id)
    .maybeSingle();
  const hasAnotherActiveParty = Boolean(await fetchActivePartyId(supabase, user.id, partyId));
  const isFeedbackDue =
    Boolean(currentUserMembership && FEEDBACK_ELIGIBLE_MEMBER_STATUSES.includes(currentUserMembership.status)) &&
    new Date(party.scheduled_at).getTime() <= Date.now() - FEEDBACK_DELAY_HOURS * 60 * 60 * 1000;

  return {
    ...party,
    creator: participantProfiles.get(party.creator_id) ?? null,
    members: members.map((member) => ({
      membership: member,
      profile:
        participantProfiles.get(member.user_id) ?? {
          id: member.user_id,
          email: "",
          nickname: "알 수 없음",
          school: "",
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
    })),
    joinedCount,
    currentUserMembership,
    hasSubmittedFeedback: Boolean(reviewData),
    isFeedbackDue,
    hasAnotherActiveParty,
  };
}

export async function getFeedbackPageData(partyId: string) {
  const { user } = await requireAuth();
  const party = await getPartyDetail(partyId);

  if (!party) {
    return null;
  }

  const participants = party.members.filter(
    (participant) =>
      participant.profile.id !== user.id &&
      FEEDBACK_ELIGIBLE_MEMBER_STATUSES.includes(participant.membership.status),
  );

  return {
    party,
    participants,
    canSubmitFeedback: Boolean(
      party.currentUserMembership &&
        FEEDBACK_ELIGIBLE_MEMBER_STATUSES.includes(party.currentUserMembership.status),
    ),
  };
}

export async function getMyPageData() {
  const { supabase, user, profile } = await requireAuth();
  const { data: memberships, error } = await supabase
    .from("party_members")
    .select("*")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (error) {
    throw new Error("내 이용 이력을 불러오지 못했습니다.");
  }

  const partyIds = ((memberships ?? []) as PartyMember[]).map((membership) => membership.party_id);
  const { data: parties } = partyIds.length
    ? await supabase.from("taxi_parties").select("*").in("id", partyIds).order("scheduled_at", { ascending: false })
    : { data: [] };
  const { data: deletionRequest } = await supabase
    .from("account_deletion_requests")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const membershipByPartyId = new Map(
    ((memberships ?? []) as PartyMember[]).map((membership) => [membership.party_id, membership]),
  );

  return {
    profile,
    history: ((parties ?? []) as TaxiParty[]).map((party) => ({
      ...party,
      membershipStatus: membershipByPartyId.get(party.id)?.status ?? null,
    })),
    deletionRequest: (deletionRequest as AccountDeletionRequest | null) ?? null,
  };
}

export async function getAdminPageData() {
  const { supabase } = await requireAdmin();
  const [{ data: users }, { data: parties }, { data: reports }, { data: deletionRequests }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("taxi_parties").select("*").order("scheduled_at", { ascending: false }),
    supabase.from("reports").select("*").order("created_at", { ascending: false }),
    supabase.from("account_deletion_requests").select("*").order("created_at", { ascending: false }),
  ]);

  const reportRows = (reports ?? []) as Report[];
  const relatedProfileIds = [...new Set(reportRows.flatMap((report) => [report.reporter_id, report.reported_user_id]))];
  const profilesMap = await fetchProfilesMap(supabase, relatedProfileIds);

  return {
    users: (users ?? []) as Profile[],
    parties: (parties ?? []) as TaxiParty[],
    reports: reportRows.map((report) => ({
      ...report,
      reporterName: profilesMap.get(report.reporter_id)?.nickname ?? report.reporter_id,
      reportedUserName: profilesMap.get(report.reported_user_id)?.nickname ?? report.reported_user_id,
    })),
    deletionRequests: (deletionRequests ?? []) as AccountDeletionRequest[],
  };
}

import { FEEDBACK_DELAY_HOURS } from "@/lib/constants";
import { getOptionalAuthContext, requireAdmin, requireAuth, type ServerSupabaseClient } from "@/lib/queries/auth";
import type {
  AccountDeletionRequest,
  ActivePartySnapshot,
  GuestbookEntry,
  GuestbookEntryLike,
  MemberStatus,
  PartyDetail,
  PartyListItem,
  PartyMember,
  PartyMemberNote,
  Profile,
  Report,
  ThemeFunRankInfo,
  TaxiParty,
  UserAccessLog,
} from "@/types/database";

const ACTIVE_PARTY_STATUSES = ["recruiting", "full"] as const;
const FEEDBACK_ELIGIBLE_MEMBER_STATUSES: MemberStatus[] = ["joined", "completed"];
const PARTY_STATUS_PRIORITY: Record<TaxiParty["status"], number> = {
  recruiting: 0,
  full: 1,
  completed: 2,
  expired: 3,
  cancelled: 4,
};

function normalizeProfile(data: Partial<Profile> & Pick<Profile, "id" | "email" | "nickname" | "school" | "role" | "created_at" | "updated_at">): Profile {
  return {
    ...data,
    department: data.department ?? null,
    student_number: data.student_number ?? null,
    profile_message: data.profile_message ?? null,
  };
}

function normalizeParty(data: Partial<TaxiParty> & Pick<TaxiParty, "id" | "creator_id" | "school" | "departure_place_name" | "destination_name" | "scheduled_at" | "capacity" | "status" | "created_at" | "updated_at">): TaxiParty {
  return {
    ...data,
    departure_detail: data.departure_detail ?? null,
    departure_lat: data.departure_lat ?? null,
    departure_lng: data.departure_lng ?? null,
    destination_lat: data.destination_lat ?? null,
    destination_lng: data.destination_lng ?? null,
    note: data.note ?? null,
    taxi_called: data.taxi_called ?? false,
    everyone_ready: data.everyone_ready ?? false,
  };
}

function getDateRange(date: string) {
  const start = new Date(`${date}T00:00:00+09:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function sortPartyList<T extends PartyListItem>(items: T[]) {
  return [...items].sort((a, b) => {
    const statusDiff = PARTY_STATUS_PRIORITY[a.status] - PARTY_STATUS_PRIORITY[b.status];

    if (statusDiff !== 0) {
      return statusDiff;
    }

    if (a.isJoinable !== b.isJoinable) {
      return a.isJoinable ? -1 : 1;
    }

    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
  });
}

async function fetchProfilesMap(supabase: ServerSupabaseClient, ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, Profile>();
  }

  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);

  if (error) {
    throw new Error("?꾨줈??紐⑸�???�덈???? 紐삵�??�땲??");
  }

  return new Map((data ?? []).map((profile) => {
    const normalized = normalizeProfile(profile as Profile);
    return [normalized.id, normalized] as const;
  }));
}

async function fetchPartyMembers(supabase: ServerSupabaseClient, partyIds: string[]) {
  if (partyIds.length === 0) {
    return [] as PartyMember[];
  }

  const { data, error } = await supabase.from("party_members").select("*").in("party_id", partyIds);

  if (error) {
    throw new Error("李몄�???뺣낫???�덈???? 紐삵�??�땲??");
  }

  return (data ?? []) as PartyMember[];
}

async function fetchPartyMemberNotes(supabase: ServerSupabaseClient, partyId: string) {
  const { data, error } = await supabase.from("party_member_notes").select("*").eq("party_id", partyId);

  if (error) {
    if (error.message.includes("does not exist")) {
      return new Map<string, string>();
    }

    throw new Error("??�떚??硫붾?�瑜??�덈???? 紐삵�??�땲??");
  }

  return new Map((data as PartyMemberNote[]).map((note) => [note.user_id, note.note]));
}

async function fetchGuestbookLikeSummary(
  supabase: ServerSupabaseClient,
  entryIds: string[],
  currentUserId: string | null,
) {
  if (entryIds.length === 0) {
    return {
      likeCountMap: new Map<string, number>(),
      likedEntryIds: new Set<string>(),
    };
  }

  const { data, error } = await supabase.from("guestbook_entry_likes").select("entry_id, user_id").in("entry_id", entryIds);

  if (error) {
    if (error.message.includes("does not exist")) {
      return {
        likeCountMap: new Map<string, number>(),
        likedEntryIds: new Set<string>(),
      };
    }

    throw new Error("諛⑸챸濡??�뗭�?�? ?�덈???? 紐삵�??�땲??");
  }

  const likeRows = (data ?? []) as Pick<GuestbookEntryLike, "entry_id" | "user_id">[];
  const likeCountMap = new Map<string, number>();
  const likedEntryIds = new Set<string>();

  likeRows.forEach((like) => {
    likeCountMap.set(like.entry_id, (likeCountMap.get(like.entry_id) ?? 0) + 1);

    if (currentUserId && like.user_id === currentUserId) {
      likedEntryIds.add(like.entry_id);
    }
  });

  return {
    likeCountMap,
    likedEntryIds,
  };
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
    throw new Error("?꾩옱 李몄�?以묒????�꽦 ??�떆??�쓣 ?뺤씤??? 紐삵�??�땲??");
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
    throw new Error("??�꽦 ??�떆???곹깭???�덈???? 紐삵�??�땲??");
  }

  return (activeParties ?? []).map((party) => party.id);
}

async function fetchActivePartyId(supabase: ServerSupabaseClient, userId: string, excludePartyId?: string) {
  const activePartyIds = await fetchActivePartyIdsForUser(supabase, userId, excludePartyId);
  return activePartyIds[0] ?? null;
}

async function getPendingFeedbackPartiesForUser(supabase: ServerSupabaseClient, userId: string) {
  const cutoff = new Date(Date.now() - FEEDBACK_DELAY_HOURS * 60 * 60 * 1000).toISOString();

  const { data: memberships, error: membershipError } = await supabase
    .from("party_members")
    .select("*")
    .eq("user_id", userId)
    .in("status", FEEDBACK_ELIGIBLE_MEMBER_STATUSES);

  if (membershipError) {
    throw new Error("??�뱶�???????�떚???뺤씤??? 紐삵�??�땲??");
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
    throw new Error("??�뱶�???????�떚???�덈???? 紐삵�??�땲??");
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("party_id")
    .eq("reviewer_id", userId)
    .in("party_id", partyIds);

  const reviewedPartyIds = new Set((reviews ?? []).map((review) => review.party_id));

  return ((parties ?? []) as TaxiParty[])
    .map((party) => normalizeParty(party as TaxiParty))
    .filter((party) => !reviewedPartyIds.has(party.id));
}

async function fetchSharedRideStatsWithCreators(
  supabase: ServerSupabaseClient,
  currentUserId: string,
  creatorIds: string[],
) {
  const uniqueCreatorIds = [...new Set(creatorIds.filter((creatorId) => creatorId !== currentUserId))];

  if (uniqueCreatorIds.length === 0) {
    return new Map<string, { lastRideAt: string; count: number }>();
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("party_members")
    .select("party_id")
    .eq("user_id", currentUserId)
    .eq("status", "completed");

  if (membershipError) {
    throw new Error("??�쟾 ??�듅 湲곕�???�덈???? 紐삵�??�땲??");
  }

  const completedPartyIds = (memberships ?? []).map((membership) => membership.party_id).filter(Boolean);

  if (completedPartyIds.length === 0) {
    return new Map<string, { lastRideAt: string; count: number }>();
  }

  const { data: parties, error: partyError } = await supabase
    .from("taxi_parties")
    .select("id, creator_id, scheduled_at")
    .in("id", completedPartyIds)
    .in("creator_id", uniqueCreatorIds)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false });

  if (partyError) {
    throw new Error("??�쟾 ??�듅 湲곕�???�덈???? 紐삵�??�땲??");
  }

  const statsMap = new Map<string, { lastRideAt: string; count: number }>();

  for (const party of parties ?? []) {
    const current = statsMap.get(party.creator_id);

    if (!current) {
      statsMap.set(party.creator_id, {
        lastRideAt: party.scheduled_at,
        count: 1,
      });
      continue;
    }

    statsMap.set(party.creator_id, {
      lastRideAt: current.lastRideAt,
      count: current.count + 1,
    });
  }

  return statsMap;
}

async function fetchCreatorReviewSummary(
  supabase: ServerSupabaseClient,
  creatorIds: string[],
) {
  const uniqueCreatorIds = [...new Set(creatorIds.filter(Boolean))];

  if (uniqueCreatorIds.length === 0) {
    return new Map<string, { average: number | null; count: number }>();
  }

  const { data: creatorParties, error: partyError } = await supabase
    .from("taxi_parties")
    .select("id, creator_id")
    .in("creator_id", uniqueCreatorIds)
    .neq("status", "cancelled");

  if (partyError) {
    throw new Error("??�꽦???꾧린 ?붿빟???�덈???? 紐삵�??�땲??");
  }

  const partyRows = (creatorParties ?? []) as Array<Pick<TaxiParty, "id" | "creator_id">>;
  const partyIds = partyRows.map((party) => party.id);

  if (partyIds.length === 0) {
    return new Map<string, { average: number | null; count: number }>();
  }

  const { data: reviews, error: reviewError } = await supabase
    .from("reviews")
    .select("party_id, punctuality_rating, comfort_rating")
    .in("party_id", partyIds);

  if (reviewError) {
    throw new Error("??�꽦???꾧린 ?붿빟???�덈???? 紐삵�??�땲??");
  }

  const creatorByPartyId = new Map(partyRows.map((party) => [party.id, party.creator_id]));
  const aggregateMap = new Map<string, { score: number; count: number }>();

  for (const review of reviews ?? []) {
    const creatorId = creatorByPartyId.get(review.party_id);

    if (!creatorId) {
      continue;
    }

    const averageForReview = (review.punctuality_rating + review.comfort_rating) / 2;
    const current = aggregateMap.get(creatorId) ?? { score: 0, count: 0 };
    aggregateMap.set(creatorId, {
      score: current.score + averageForReview,
      count: current.count + 1,
    });
  }

  const summaryMap = new Map<string, { average: number | null; count: number }>();

  uniqueCreatorIds.forEach((creatorId) => {
    const aggregate = aggregateMap.get(creatorId);

    if (!aggregate || aggregate.count === 0) {
      summaryMap.set(creatorId, { average: null, count: 0 });
      return;
    }

    summaryMap.set(creatorId, {
      average: Number((aggregate.score / aggregate.count).toFixed(1)),
      count: aggregate.count,
    });
  });

  return summaryMap;
}

async function fetchFavoriteDepartures(supabase: ServerSupabaseClient, userId: string) {
  const { data: memberships, error: membershipError } = await supabase
    .from("party_members")
    .select("party_id")
    .eq("user_id", userId)
    .in("status", ["joined", "completed"]);

  if (membershipError) {
    throw new Error("?�?�� ?곕뒗 ?�쒕컻吏????�덈???? 紐삵�??�땲??");
  }

  const partyIds = (memberships ?? []).map((membership) => membership.party_id).filter(Boolean);

  if (partyIds.length === 0) {
    return [] as string[];
  }

  const { data: parties, error: partyError } = await supabase
    .from("taxi_parties")
    .select("departure_place_name")
    .in("id", partyIds)
    .order("scheduled_at", { ascending: false });

  if (partyError) {
    throw new Error("?�?�� ?곕뒗 ?�쒕컻吏????�덈???? 紐삵�??�땲??");
  }

  const counter = new Map<string, number>();

  for (const party of parties ?? []) {
    const departure = party.departure_place_name?.trim();

    if (!departure) {
      continue;
    }

    counter.set(departure, (counter.get(departure) ?? 0) + 1);
  }

  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([departure]) => departure);
}

async function fetchTodayStats(supabase: ServerSupabaseClient) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data: parties, error: partyError } = await supabase
    .from("taxi_parties")
    .select("id")
    .eq("status", "completed")
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString());

  if (partyError) {
    throw new Error("??�뒛 ?묒듅 ???��瑜??�덈???? 紐삵�??�땲??");
  }

  const partyIds = (parties ?? []).map((party) => party.id);

  if (partyIds.length === 0) {
    return {
      completedParties: 0,
      riders: 0,
    };
  }

  const { count, error: memberError } = await supabase
    .from("party_members")
    .select("id", { count: "exact", head: true })
    .in("party_id", partyIds)
    .in("status", ["joined", "completed"]);

  if (memberError) {
    throw new Error("??�뒛 ?묒듅 ???��瑜??�덈???? 紐삵�??�땲??");
  }

  return {
    completedParties: partyIds.length,
    riders: count ?? 0,
  };
}

async function decoratePartyList(
  supabase: ServerSupabaseClient,
  parties: TaxiParty[],
  currentUserId: string | null,
) {
  const normalizedParties = parties.map((party) => normalizeParty(party));
  const partyIds = normalizedParties.map((party) => party.id);
  const members = await fetchPartyMembers(supabase, partyIds);
  const creatorIds = [...new Set(normalizedParties.map((party) => party.creator_id))];
  const [profilesMap, activePartyId, sharedRideStatsMap, creatorReviewSummaryMap, themeFunRankMap] = await Promise.all([
    fetchProfilesMap(supabase, creatorIds),
    currentUserId ? fetchActivePartyId(supabase, currentUserId) : Promise.resolve(null),
    currentUserId
      ? fetchSharedRideStatsWithCreators(supabase, currentUserId, creatorIds)
      : Promise.resolve(new Map<string, { lastRideAt: string; count: number }>()),
    fetchCreatorReviewSummary(supabase, creatorIds),
    fetchThemeFunRankMap(supabase),
  ]);
  const membersByPartyId = new Map<string, PartyMember[]>();

  members.forEach((member) => {
    const bucket = membersByPartyId.get(member.party_id) ?? [];
    bucket.push(member);
    membersByPartyId.set(member.party_id, bucket);
  });

  return normalizedParties.map((party) => {
    const partyMembers = membersByPartyId.get(party.id) ?? [];
    const joinedMembers = partyMembers.filter((member) => member.status === "joined");
    const myMembership = currentUserId
      ? partyMembers.find((member) => member.user_id === currentUserId) ?? null
      : null;
    const joinedCount = joinedMembers.length;
    const seatsLeft = Math.max(party.capacity - joinedCount, 0);
    const isFuture = new Date(party.scheduled_at).getTime() > Date.now();
    const isRecruiting = party.status === "recruiting";
    const blockedByAnotherActiveParty = Boolean(currentUserId && activePartyId && activePartyId !== party.id);
    const isJoinable = isFuture && isRecruiting && seatsLeft > 0 && !myMembership && !blockedByAnotherActiveParty;
    const joinDisabledReason = isJoinable
      ? null
      : myMembership
        ? "already_joined"
        : party.status === "full" || seatsLeft === 0
          ? "full"
          : party.status === "completed"
            ? "completed"
            : party.status === "expired" || party.status === "cancelled"
              ? "expired"
              : !isFuture
                ? "departed"
                : blockedByAnotherActiveParty
                  ? "other_active_party"
                  : null;
    const rideStats = sharedRideStatsMap.get(party.creator_id);
    const reviewSummary = creatorReviewSummaryMap.get(party.creator_id) ?? { average: null, count: 0 };

    return {
      ...party,
      creatorNickname: profilesMap.get(party.creator_id)?.nickname ?? "??�챸",
      lastRideAtWithCreator: rideStats?.lastRideAt ?? null,
      sharedRideCount: rideStats?.count ?? 0,
      creatorAverageRating: reviewSummary.average,
      creatorReviewCount: reviewSummary.count,
      creatorThemeFunRank: themeFunRankMap.get(party.creator_id)?.rank ?? null,
      creatorThemeFunCount: themeFunRankMap.get(party.creator_id)?.count ?? 0,
      joinedCount,
      seatsLeft,
      myMembershipStatus: (myMembership?.status as MemberStatus | undefined) ?? null,
      isJoinable,
      joinDisabledReason,
    } satisfies PartyListItem;
  });
}

export async function getPendingFeedbackPartiesForCurrentUser() {
  const { supabase, user } = await requireAuth();
  return getPendingFeedbackPartiesForUser(supabase, user.id);
}

export async function getActivePartySnapshotForCurrentUser(): Promise<ActivePartySnapshot | null> {
  const { supabase, user } = await getOptionalAuthContext();

  if (!user) {
    return null;
  }

  const activePartyId = await fetchActivePartyId(supabase, user.id);

  if (!activePartyId) {
    return null;
  }

  const { data: partyData, error } = await supabase
    .from("taxi_parties")
    .select("*")
    .eq("id", activePartyId)
    .maybeSingle();

  if (error) {
    throw new Error("?꾩옱 李몄�?以묒????�떆??�쓣 ?�덈???? 紐삵�??�땲??");
  }

  if (!partyData) {
    return null;
  }

  const party = normalizeParty(partyData as TaxiParty);
  const members = await fetchPartyMembers(supabase, [activePartyId]);
  const joinedMembers = members.filter((member) => member.status === "joined");
  const myMembership = members.find((member) => member.user_id === user.id) ?? null;

  return {
    ...party,
    joinedCount: joinedMembers.length,
    seatsLeft: Math.max(party.capacity - joinedMembers.length, 0),
    myMembershipStatus: (myMembership?.status as MemberStatus | undefined) ?? null,
  } satisfies ActivePartySnapshot;
}

export async function getHomePageData() {
  const { supabase, user, profile } = await getOptionalAuthContext();
  const [favoriteDepartures, todayStats] = await Promise.all([
    user ? fetchFavoriteDepartures(supabase, user.id) : Promise.resolve([] as string[]),
    fetchTodayStats(supabase),
  ]);

  return {
    user,
    profile,
    favoriteDepartures,
    todayStats,
  };
}

export async function getPartyList(filters: { q?: string; date?: string; availability?: string }) {
  const { supabase, user } = await getOptionalAuthContext();
  let query = supabase
    .from("taxi_parties")
    .select("*")
    .neq("status", "cancelled");

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
    throw new Error("??�떆??紐⑸�???�덈???? 紐삵�??�땲??");
  }

  const items = sortPartyList(await decoratePartyList(supabase, (data ?? []) as TaxiParty[], user?.id ?? null));

  if (filters.availability === "joinable") {
    return items.filter((item) => item.isJoinable);
  }

  return items;
}

export async function getPartyDetail(partyId: string): Promise<PartyDetail | null> {
  const { supabase, user } = await getOptionalAuthContext();
  const { data: partyData, error } = await supabase
    .from("taxi_parties")
    .select("*")
    .eq("id", partyId)
    .maybeSingle();

  if (error) {
    throw new Error("??�떆???뺣낫???�덈???? 紐삵�??�땲??");
  }

  if (!partyData) {
    return null;
  }

  const party = normalizeParty(partyData as TaxiParty);
  const [members, memberNotesMap, reviewResult, activePartyId, creatorReviewSummaryMap, themeFunRankMap] = await Promise.all([
    fetchPartyMembers(supabase, [partyId]),
    fetchPartyMemberNotes(supabase, partyId),
    user
      ? supabase.from("reviews").select("id").eq("party_id", partyId).eq("reviewer_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user ? fetchActivePartyId(supabase, user.id, partyId) : Promise.resolve(null),
    fetchCreatorReviewSummary(supabase, [party.creator_id]),
    fetchThemeFunRankMap(supabase),
  ]);
  const participantProfiles = await fetchProfilesMap(
    supabase,
    [...new Set([party.creator_id, ...members.map((member) => member.user_id)])],
  );
  const currentUserMembership = user ? members.find((member) => member.user_id === user.id) ?? null : null;
  const joinedCount = members.filter((member) => member.status === "joined").length;
  const reviewData = reviewResult.data;
  const hasAnotherActiveParty = user ? Boolean(activePartyId) : false;
  const creatorReviewSummary = creatorReviewSummaryMap.get(party.creator_id) ?? { average: null, count: 0 };
  const isFeedbackDue =
    Boolean(currentUserMembership && FEEDBACK_ELIGIBLE_MEMBER_STATUSES.includes(currentUserMembership.status)) &&
    new Date(party.scheduled_at).getTime() <= Date.now() - FEEDBACK_DELAY_HOURS * 60 * 60 * 1000;

  return {
    ...party,
    creator: participantProfiles.get(party.creator_id) ?? null,
    members: members.map((member) => ({
      membership: member,
      note: memberNotesMap.get(member.user_id) ?? null,
      themeFunRank: themeFunRankMap.get(member.user_id)?.rank ?? null,
      themeFunCount: themeFunRankMap.get(member.user_id)?.count ?? 0,
      profile:
        participantProfiles.get(member.user_id) ??
        normalizeProfile({
          id: member.user_id,
          email: "",
          nickname: "??????�쓬",
          school: "",
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
    })),
    creatorAverageRating: creatorReviewSummary.average,
    creatorReviewCount: creatorReviewSummary.count,
    creatorThemeFunRank: themeFunRankMap.get(party.creator_id)?.rank ?? null,
    creatorThemeFunCount: themeFunRankMap.get(party.creator_id)?.count ?? 0,
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
  const [{ data: memberships, error }, { data: deletionRequest }] = await Promise.all([
    supabase
      .from("party_members")
      .select("*")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false }),
    supabase
      .from("account_deletion_requests")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (error) {
    throw new Error("????�슜 ??�????�덈???? 紐삵�??�땲??");
  }

  const partyIds = ((memberships ?? []) as PartyMember[]).map((membership) => membership.party_id);
  const { data: parties } = partyIds.length
    ? await supabase.from("taxi_parties").select("*").in("id", partyIds).order("scheduled_at", { ascending: false })
    : { data: [] };

  const membershipByPartyId = new Map(
    ((memberships ?? []) as PartyMember[]).map((membership) => [membership.party_id, membership]),
  );

  return {
    profile: normalizeProfile(profile as Profile),
    history: ((parties ?? []) as TaxiParty[]).map((party) => ({
      ...normalizeParty(party),
      membershipStatus: membershipByPartyId.get(party.id)?.status ?? null,
    })),
    deletionRequest: (deletionRequest as AccountDeletionRequest | null) ?? null,
  };
}

export async function getWaitingPageData() {
  const { supabase, user, profile } = await getOptionalAuthContext();
  const { data, error } = await supabase
    .from("guestbook_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error("諛⑸챸濡?�쓣 ?�덈???? 紐삵�??�땲??");
  }

  const entries = (data ?? []) as GuestbookEntry[];
  const [profilesMap, likeSummary, themeFunRankMap] = await Promise.all([
    fetchProfilesMap(
      supabase,
      [...new Set(entries.map((entry) => entry.user_id))],
    ),
    fetchGuestbookLikeSummary(
      supabase,
      entries.map((entry) => entry.id),
      user?.id ?? null,
    ),
    fetchThemeFunRankMap(supabase),
  ]);
  const { likeCountMap, likedEntryIds } = likeSummary;

  return {
    profile: profile ? normalizeProfile(profile as Profile) : null,
    entries: entries.map((entry) => ({
      ...entry,
      nickname: profilesMap.get(entry.user_id)?.nickname ?? "??�챸",
      profileMessage: profilesMap.get(entry.user_id)?.profile_message ?? null,
      themeFunRank: themeFunRankMap.get(entry.user_id)?.rank ?? null,
      themeFunCount: themeFunRankMap.get(entry.user_id)?.count ?? 0,
      likeCount: likeCountMap.get(entry.id) ?? 0,
      likedByMe: likedEntryIds.has(entry.id),
    })),
  };
}

export async function getAdminPageData() {
  const { supabase } = await requireAdmin();
  const [{ data: users }, { data: parties }, { data: reports }, { data: deletionRequests }, accessLogsResult] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("taxi_parties").select("*").order("scheduled_at", { ascending: false }),
    supabase.from("reports").select("*").order("created_at", { ascending: false }),
    supabase.from("account_deletion_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("user_access_logs").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  const reportRows = (reports ?? []) as Report[];
  const accessLogs = accessLogsResult.error && accessLogsResult.error.message.includes("does not exist")
    ? []
    : ((accessLogsResult.data ?? []) as UserAccessLog[]);
  const relatedProfileIds = [...new Set([
    ...reportRows.flatMap((report) => [report.reporter_id, report.reported_user_id]),
    ...accessLogs.map((log) => log.user_id),
  ])];
  const profilesMap = await fetchProfilesMap(supabase, relatedProfileIds);

  return {
    users: ((users ?? []) as Profile[]).map((user) => normalizeProfile(user)),
    parties: ((parties ?? []) as TaxiParty[]).map((party) => normalizeParty(party)),
    reports: reportRows.map((report) => ({
      ...report,
      reporterName: profilesMap.get(report.reporter_id)?.nickname ?? report.reporter_id,
      reportedUserName: profilesMap.get(report.reported_user_id)?.nickname ?? report.reported_user_id,
    })),
    deletionRequests: (deletionRequests ?? []) as AccountDeletionRequest[],
    accessLogs: accessLogs.map((log) => ({
      ...log,
      nickname: profilesMap.get(log.user_id)?.nickname ?? "�͸�",
      email: profilesMap.get(log.user_id)?.email ?? null,
    })),
  };
}

type ThemeFunRankingRow = {
  user_id: string;
  click_count: number;
};

type ThemeFunRankingItem = ThemeFunRankInfo & {
  userId: string;
};

async function fetchThemeFunRankingRows(supabase: ServerSupabaseClient) {
  const { data, error } = await supabase
    .from("theme_fun_rankings")
    .select("user_id, click_count")
    .order("click_count", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(3);

  if (error) {
    if (error.message.includes("does not exist")) {
      return [] as ThemeFunRankingRow[];
    }

    throw new Error("???�� ?λ�???�???�덈???? 紐삵�??�땲??");
  }

  return (data ?? []) as ThemeFunRankingRow[];
}

async function fetchThemeFunRankingItems(supabase: ServerSupabaseClient): Promise<ThemeFunRankingItem[]> {
  const rows = await fetchThemeFunRankingRows(supabase);
  const profilesMap = await fetchProfilesMap(supabase, rows.map((row) => row.user_id));

  return rows.map((row, index) => ({
    userId: row.user_id,
    nickname: profilesMap.get(row.user_id)?.nickname ?? "??�챸",
    count: row.click_count,
    rank: index + 1,
  }));
}

async function fetchThemeFunRankMap(supabase: ServerSupabaseClient) {
  const items = await fetchThemeFunRankingItems(supabase);
  return new Map(items.map((item) => [item.userId, { rank: item.rank, count: item.count, nickname: item.nickname }]));
}

export async function getThemeFunRankingWithClient(supabase: ServerSupabaseClient): Promise<ThemeFunRankInfo[]> {
  const items = await fetchThemeFunRankingItems(supabase);
  return items.map((item) => ({
    rank: item.rank,
    nickname: item.nickname,
    count: item.count,
  }));
}

export async function getThemeFunRanking() {
  const { supabase } = await getOptionalAuthContext();
  return getThemeFunRankingWithClient(supabase);
}












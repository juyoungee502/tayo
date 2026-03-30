"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/form-state";
import { requireAuth } from "@/lib/queries/auth";
import { feedbackSchema } from "@/lib/validators/feedback";
import { partySchema } from "@/lib/validators/party";
import { deletionRequestSchema, profileSchema } from "@/lib/validators/profile";
import { decorateNoteWithUrgency, parseErrorMessage } from "@/lib/utils";
import type { ReportReason } from "@/types/database";

function fromValidationErrors(fieldErrors: Record<string, string[] | undefined>): ActionState {
  const entries = Object.entries(fieldErrors).filter(([, value]) => value && value.length > 0) as Array<
    [string, string[]]
  >;

  return {
    ...INITIAL_ACTION_STATE,
    fieldErrors: Object.fromEntries(entries),
  };
}

export async function signOutAction() {
  const { supabase } = await requireAuth();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createPartyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = partySchema.safeParse({
    departurePlaceName: formData.get("departurePlaceName"),
    departureDetail: formData.get("departureDetail"),
    departureLat: formData.get("departureLat"),
    departureLng: formData.get("departureLng"),
    destinationPlaceName: formData.get("destinationPlaceName"),
    destinationLat: formData.get("destinationLat"),
    destinationLng: formData.get("destinationLng"),
    scheduledAt: formData.get("scheduledAt"),
    capacity: formData.get("capacity"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return fromValidationErrors(parsed.error.flatten().fieldErrors);
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);

  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    return {
      message: "미래 시각으로 출발 시간을 설정해주세요.",
    };
  }

  try {
    const { supabase } = await requireAuth();
    const urgent = String(formData.get("isUrgent") ?? "") === "true";
    const normalizedNote = decorateNoteWithUrgency(parsed.data.note ?? "", urgent);

    const { data, error } = await supabase.rpc("create_taxi_party", {
      p_departure_place_name: parsed.data.departurePlaceName,
      p_departure_detail: parsed.data.departureDetail ?? "",
      p_departure_lat: parsed.data.departureLat ? Number(parsed.data.departureLat) : null,
      p_departure_lng: parsed.data.departureLng ? Number(parsed.data.departureLng) : null,
      p_destination_name: parsed.data.destinationPlaceName,
      p_destination_lat: parsed.data.destinationLat ? Number(parsed.data.destinationLat) : null,
      p_destination_lng: parsed.data.destinationLng ? Number(parsed.data.destinationLng) : null,
      p_scheduled_at: scheduledAt.toISOString(),
      p_capacity: parsed.data.capacity,
      p_note: normalizedNote,
    });

    if (error || !data) {
      throw new Error(error?.message || "택시팟을 생성하지 못했습니다.");
    }

    revalidatePath("/home");
    revalidatePath("/parties");
    revalidatePath("/mypage");

    return {
      success: true,
      redirectTo: `/parties/${data}`,
    };
  } catch (error) {
    return {
      message: parseErrorMessage(error, "택시팟 생성에 실패했습니다."),
    };
  }
}

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    nickname: formData.get("nickname"),
  });

  if (!parsed.success) {
    return fromValidationErrors(parsed.error.flatten().fieldErrors);
  }

  try {
    const { supabase, user } = await requireAuth();
    const { error } = await supabase.from("profiles").update({ nickname: parsed.data.nickname }).eq("id", user.id);

    if (error) {
      throw new Error(error.message || "프로필을 수정하지 못했습니다.");
    }

    revalidatePath("/mypage");
    revalidatePath("/home");

    return {
      success: true,
      message: "프로필이 업데이트되었습니다.",
    };
  } catch (error) {
    return {
      message: parseErrorMessage(error, "프로필 수정에 실패했습니다."),
    };
  }
}

export async function submitDeletionRequestAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = deletionRequestSchema.safeParse({
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return fromValidationErrors(parsed.error.flatten().fieldErrors);
  }

  try {
    const { supabase, user } = await requireAuth();
    const { error } = await supabase.from("account_deletion_requests").upsert(
      {
        user_id: user.id,
        note: parsed.data.note ?? "",
        status: "open",
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw new Error(error.message || "탈퇴 요청을 저장하지 못했습니다.");
    }

    revalidatePath("/mypage");
    revalidatePath("/admin");

    return {
      success: true,
      message: "탈퇴 요청이 접수되었습니다. 관리자가 확인 후 안내할 예정입니다.",
    };
  } catch (error) {
    return {
      message: parseErrorMessage(error, "탈퇴 요청에 실패했습니다."),
    };
  }
}

export async function submitFeedbackAction(
  partyId: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = feedbackSchema.safeParse({
    punctualityRating: formData.get("punctualityRating"),
    comfortRating: formData.get("comfortRating"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return fromValidationErrors(parsed.error.flatten().fieldErrors);
  }

  const selectedIds = [...new Set(formData.getAll("reportedUserId").map(String).filter(Boolean))];
  const reports = selectedIds.map((userId) => ({
    reported_user_id: userId,
    reason: String(formData.get(`reportReason_${userId}`) ?? "other") as ReportReason,
    detail: String(formData.get(`reportDetail_${userId}`) ?? ""),
  }));

  try {
    const { supabase } = await requireAuth();
    const { error } = await supabase.rpc("submit_feedback", {
      p_party_id: partyId,
      p_punctuality_rating: parsed.data.punctualityRating,
      p_comfort_rating: parsed.data.comfortRating,
      p_comment: parsed.data.comment ?? "",
      p_reports: reports,
    });

    if (error) {
      throw new Error(error.message || "피드백을 저장하지 못했습니다.");
    }

    revalidatePath(`/feedback/${partyId}`);
    revalidatePath("/home");
    revalidatePath("/mypage");
    revalidatePath("/admin");

    return {
      success: true,
      message: "피드백이 저장되었습니다.",
    };
  } catch (error) {
    return {
      message: parseErrorMessage(error, "피드백 제출에 실패했습니다."),
    };
  }
}

export async function updatePartyCapacityAction(partyId: string, formData: FormData) {
  const nextCapacity = Number(formData.get("capacity"));

  if (!Number.isInteger(nextCapacity) || nextCapacity < 2 || nextCapacity > 4) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("정원은 2명에서 4명 사이만 설정할 수 있습니다.")}`);
  }

  const { supabase, user } = await requireAuth();
  await supabase.rpc("complete_due_parties");

  const { data: party, error: fetchError } = await supabase
    .from("taxi_parties")
    .select("creator_id, scheduled_at, status")
    .eq("id", partyId)
    .maybeSingle();

  if (fetchError || !party) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("택시팟 정보를 찾지 못했습니다.")}`);
  }

  if (party.creator_id !== user.id) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("생성자만 정원을 수정할 수 있습니다.")}`);
  }

  if (new Date(party.scheduled_at).getTime() <= Date.now() || party.status === "completed" || party.status === "cancelled") {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("이미 종료된 택시팟은 수정할 수 없습니다.")}`);
  }

  const { count: joinedCount, error: memberError } = await supabase
    .from("party_members")
    .select("id", { count: "exact", head: true })
    .eq("party_id", partyId)
    .eq("status", "joined");

  if (memberError) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("현재 참여 인원을 확인하지 못했습니다.")}`);
  }

  if ((joinedCount ?? 0) > nextCapacity) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("현재 참여 인원보다 적게 정원을 줄일 수 없습니다.")}`);
  }

  const { error: updateError } = await supabase.from("taxi_parties").update({ capacity: nextCapacity }).eq("id", partyId);

  if (updateError) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent(updateError.message || "정원 수정에 실패했습니다.")}`);
  }

  await supabase.rpc("sync_party_status", { p_party_id: partyId });

  revalidatePath(`/parties/${partyId}`);
  revalidatePath("/parties");
  revalidatePath("/home");
  revalidatePath("/mypage");
  redirect(`/parties/${partyId}?message=${encodeURIComponent("정원이 업데이트되었습니다.")}`);
}


export async function markPartyDepartedAction(partyId: string) {
  const { supabase, user } = await requireAuth();
  await supabase.rpc("complete_due_parties");

  const { data: party, error: partyError } = await supabase
    .from("taxi_parties")
    .select("creator_id, status")
    .eq("id", partyId)
    .maybeSingle();

  if (partyError || !party) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("택시팟 정보를 찾지 못했습니다.")}`);
  }

  if (party.creator_id !== user.id) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("생성자만 출발 상태를 확정할 수 있습니다.")}`);
  }

  if (party.status === "completed" || party.status === "cancelled" || party.status === "expired") {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("이미 종료된 택시팟입니다.")}`);
  }

  const { error: partyUpdateError } = await supabase
    .from("taxi_parties")
    .update({ status: "completed" })
    .eq("id", partyId);

  if (partyUpdateError) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent(partyUpdateError.message || "출발 상태 반영에 실패했습니다.")}`);
  }

  const { error: memberUpdateError } = await supabase
    .from("party_members")
    .update({ status: "completed" })
    .eq("party_id", partyId)
    .eq("status", "joined");

  if (memberUpdateError) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent(memberUpdateError.message || "참여자 상태 반영에 실패했습니다.")}`);
  }

  revalidatePath(`/parties/${partyId}`);
  revalidatePath("/parties");
  revalidatePath("/home");
  revalidatePath("/mypage");
  redirect(`/parties/${partyId}?message=${encodeURIComponent("출발 상태로 변경했어요. 이 팟은 운행 완료로 정리됩니다.")}`);
}
export async function nudgePartyAction(partyId: string) {
  const { supabase, user } = await requireAuth();
  await supabase.rpc("complete_due_parties");

  const { data: party, error: partyError } = await supabase
    .from("taxi_parties")
    .select("creator_id, scheduled_at, status")
    .eq("id", partyId)
    .maybeSingle();

  if (partyError || !party) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("택시팟 정보를 찾지 못했습니다.")}`);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("party_members")
    .select("status")
    .eq("party_id", partyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || membership?.status !== "joined") {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("참여 중인 파티원만 재촉하기를 사용할 수 있습니다.")}`);
  }

  if (party.creator_id === user.id) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("생성자는 재촉하기를 사용할 수 없습니다.")}`);
  }

  if (new Date(party.scheduled_at).getTime() <= Date.now() || party.status === "completed" || party.status === "cancelled") {
    redirect(`/parties/${partyId}?error=${encodeURIComponent("이미 종료된 택시팟은 재촉할 수 없습니다.")}`);
  }

  revalidatePath(`/parties/${partyId}`);
  redirect(`/parties/${partyId}?message=${encodeURIComponent("지금 출발해요 요청을 보냈어요. 바로 모일 준비를 해주세요.")}`);
}
export async function addGuestbookEntryAction(formData: FormData) {
  const message = String(formData.get("message") ?? "").trim();

  if (!message) {
    redirect(`/waiting?error=${encodeURIComponent("방명록 내용을 입력해주세요.")}`);
  }

  if (message.length > 160) {
    redirect(`/waiting?error=${encodeURIComponent("방명록은 160자 이내로 남겨주세요.")}`);
  }

  const { supabase, user } = await requireAuth();
  const { error } = await supabase.from("guestbook_entries").insert({
    user_id: user.id,
    message,
  });

  if (error) {
    redirect(`/waiting?error=${encodeURIComponent(error.message || "방명록 저장에 실패했습니다.")}`);
  }

  revalidatePath("/waiting");
  redirect(`/waiting?message=${encodeURIComponent("방명록이 등록되었어요.")}`);
}
async function runPartyMutation(
  partyId: string,
  action: "join_taxi_party" | "leave_taxi_party" | "cancel_taxi_party",
  successMessage: string,
) {
  const { supabase } = await requireAuth();
  await supabase.rpc("complete_due_parties");
  const { error } = await supabase.rpc(action, {
    p_party_id: partyId,
  });

  if (error) {
    redirect(`/parties/${partyId}?error=${encodeURIComponent(error.message || "처리에 실패했습니다.")}`);
  }

  revalidatePath(`/parties/${partyId}`);
  revalidatePath("/parties");
  revalidatePath("/home");
  revalidatePath("/mypage");
  redirect(`/parties/${partyId}?message=${encodeURIComponent(successMessage)}`);
}

export async function joinPartyAction(partyId: string) {
  await runPartyMutation(partyId, "join_taxi_party", "택시팟에 참여했습니다.");
}

export async function leavePartyAction(partyId: string) {
  await runPartyMutation(partyId, "leave_taxi_party", "택시팟 참여를 취소했습니다.");
}

export async function cancelPartyAction(partyId: string) {
  await runPartyMutation(partyId, "cancel_taxi_party", "택시팟을 취소했습니다.");
}




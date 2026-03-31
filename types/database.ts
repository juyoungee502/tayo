export type UserRole = "user" | "admin";
export type PartyStatus = "recruiting" | "full" | "completed" | "cancelled" | "expired";
export type MemberStatus = "joined" | "left" | "removed" | "completed";
export type ReportReason = "late" | "no_show" | "unsafe_behavior" | "rude_behavior" | "other";

export interface Profile {
  id: string;
  email: string;
  nickname: string;
  school: string;
  role: UserRole;
  department: string | null;
  student_number: string | null;
  profile_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxiParty {
  id: string;
  creator_id: string;
  school: string;
  departure_place_name: string;
  departure_detail: string | null;
  departure_lat: number | null;
  departure_lng: number | null;
  destination_name: string;
  destination_lat: number | null;
  destination_lng: number | null;
  scheduled_at: string;
  capacity: number;
  note: string | null;
  status: PartyStatus;
  taxi_called: boolean;
  everyone_ready: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartyMember {
  id: string;
  party_id: string;
  user_id: string;
  status: MemberStatus;
  joined_at: string;
}

export interface PartyMemberNote {
  id: string;
  party_id: string;
  user_id: string;
  note: string;
  updated_at: string;
}

export interface Review {
  id: string;
  party_id: string;
  reviewer_id: string;
  punctuality_rating: number;
  comfort_rating: number;
  comment: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  party_id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: ReportReason;
  detail: string | null;
  created_at: string;
}

export interface AccountDeletionRequest {
  id: string;
  user_id: string;
  note: string | null;
  status: "open" | "resolved";
  created_at: string;
}

export interface GuestbookEntry {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface GuestbookEntryLike {
  id: string;
  entry_id: string;
  user_id: string;
  created_at: string;
}

export interface ThemeFunRankInfo {
  rank: number;
  count: number;
  nickname: string;
}

export interface PartyListItem extends TaxiParty {
  creatorNickname: string;
  lastRideAtWithCreator: string | null;
  sharedRideCount: number;
  creatorAverageRating: number | null;
  creatorReviewCount: number;
  creatorThemeFunRank: number | null;
  creatorThemeFunCount: number;
  joinedCount: number;
  seatsLeft: number;
  myMembershipStatus: MemberStatus | null;
  isJoinable: boolean;
}

export interface PartyParticipant {
  profile: Profile;
  membership: PartyMember;
  note: string | null;
  themeFunRank: number | null;
  themeFunCount: number;
}

export interface PartyDetail extends TaxiParty {
  creator: Profile | null;
  members: PartyParticipant[];
  creatorAverageRating: number | null;
  creatorReviewCount: number;
  creatorThemeFunRank: number | null;
  creatorThemeFunCount: number;
  joinedCount: number;
  currentUserMembership: PartyMember | null;
  hasSubmittedFeedback: boolean;
  isFeedbackDue: boolean;
  hasAnotherActiveParty: boolean;
}

export interface ActivePartySnapshot extends TaxiParty {
  joinedCount: number;
  seatsLeft: number;
  myMembershipStatus: MemberStatus | null;
}


import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { SCHOOL_NAME } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deriveNickname, isAllowedLoginEmail } from "@/lib/utils";
import type { Profile } from "@/types/database";

export type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type OptionalAuthContext = {
  supabase: ServerSupabaseClient;
  user: User | null;
  profile: Profile | null;
};

export type AuthContext = {
  supabase: ServerSupabaseClient;
  user: User;
  profile: Profile;
};

async function ensureProfile(supabase: ServerSupabaseClient, user: User) {
  const { data: existingProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("프로필 정보를 불러오지 못했습니다.");
  }

  if (existingProfile) {
    return existingProfile as Profile;
  }

  const { data: insertedProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      nickname: deriveNickname(user.email ?? ""),
      school: SCHOOL_NAME,
    })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(insertError.message || "프로필을 생성하지 못했습니다.");
  }

  return insertedProfile as Profile;
}

const getOptionalAuthContextCached = cache(async (): Promise<OptionalAuthContext> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return {
      supabase,
      user: null,
      profile: null,
    };
  }

  if (!isAllowedLoginEmail(user.email)) {
    await supabase.auth.signOut();
    return {
      supabase,
      user: null,
      profile: null,
    };
  }

  await supabase.rpc("complete_due_parties");
  const profile = await ensureProfile(supabase, user);

  return {
    supabase,
    user,
    profile,
  };
});

export async function getOptionalAuthContext(): Promise<OptionalAuthContext> {
  return getOptionalAuthContextCached();
}

export async function requireAuth(): Promise<AuthContext> {
  const context = await getOptionalAuthContext();

  if (!context.user || !context.profile) {
    redirect("/login");
  }

  return context as AuthContext;
}

export async function requireAdmin() {
  const context = await requireAuth();

  if (context.profile.role !== "admin") {
    redirect(`/home?error=${encodeURIComponent("관리자만 접근할 수 있습니다.")}`);
  }

  return context;
}

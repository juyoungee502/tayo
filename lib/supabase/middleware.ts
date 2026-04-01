import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";

type CookieMutation = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function shouldTrackAccess(request: NextRequest) {
  if (request.method !== "GET") {
    return false;
  }

  if (request.headers.get("next-router-prefetch") || request.headers.get("purpose") === "prefetch") {
    return false;
  }

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return false;
  }

  return true;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && shouldTrackAccess(request)) {
    try {
      await supabase.rpc("record_user_access", {
        p_path: request.nextUrl.pathname,
        p_user_agent: request.headers.get("user-agent") ?? null,
      });
    } catch {
      // Ignore logging failures so normal navigation is never blocked.
    }
  }

  return response;
}

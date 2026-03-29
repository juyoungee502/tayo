import { redirect } from "next/navigation";

import { getOptionalAuthContext } from "@/lib/queries/auth";

export default async function IndexPage() {
  const { user } = await getOptionalAuthContext();

  redirect(user ? "/home" : "/login");
}

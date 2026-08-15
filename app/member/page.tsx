import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MemberDashboard } from "@/components/member-dashboard";

export const dynamic = "force-dynamic";

export default async function MemberPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");
  const [account] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  // Community users must use their own dashboard.
  if (account?.role === "community_user") redirect("/community/dashboard");
  // Admins should use the admin panel.
  if (account?.role && ["admin", "treasurer", "editor"].includes(account.role))
    redirect("/dashboard");
  return <MemberDashboard />;
}

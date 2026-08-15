import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

const STAFF = ["admin", "treasurer", "editor"];

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");
  const [account] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  // Role-based access control: only staff may open the admin dashboard.
  if (!account || !STAFF.includes(account.role)) {
    if (account?.role === "community_user") redirect("/community/dashboard");
    if (account?.role === "official_member") redirect("/member");
    redirect("/");
  }
  return <AdminDashboard />;
}

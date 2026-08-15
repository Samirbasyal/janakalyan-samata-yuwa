import ClubPortal from "@/components/club-portal";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

// Original behaviour: the admin panel only appears after an admin/staff
// member is logged in (inline on the home page, with a "back to site"
// button). Everyone else sees the public home page.
export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  const account = session?.user
    ? await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1)
    : [];
  const initialAdmin = ["admin", "treasurer", "editor"].includes(
    account[0]?.role ?? "",
  );
  return <ClubPortal initialAdmin={initialAdmin} />;
}

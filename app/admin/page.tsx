import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin";
import { TopNav } from "@/components/TopNav";
import { AdminDashboard } from "@/components/AdminDashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    // Pas admin → on redirige silencieusement vers l'accueil.
    redirect("/");
  }
  return (
    <>
      <TopNav crumb="Administration" />
      <AdminDashboard />
    </>
  );
}

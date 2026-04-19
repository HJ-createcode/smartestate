import { Dashboard } from "@/components/Dashboard";
import { TopNav } from "@/components/TopNav";
import { AccountSync } from "@/components/AccountSync";

export default function AppHome() {
  return (
    <>
      <AccountSync />
      <TopNav />
      <Dashboard />
    </>
  );
}

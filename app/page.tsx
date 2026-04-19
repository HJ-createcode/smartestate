import { Dashboard } from "@/components/Dashboard";
import { TopNav } from "@/components/TopNav";
import { AccountSync } from "@/components/AccountSync";

export default function Home() {
  return (
    <>
      <AccountSync />
      <TopNav />
      <Dashboard />
    </>
  );
}

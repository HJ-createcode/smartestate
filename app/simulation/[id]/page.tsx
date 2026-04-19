import { SimulationEditor } from "@/components/SimulationEditor";
import { AccountSync } from "@/components/AccountSync";

export default function SimulationPage({ params }: { params: { id: string } }) {
  return (
    <>
      <AccountSync />
      <SimulationEditor assetId={params.id} />
    </>
  );
}

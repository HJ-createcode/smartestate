import { SimulationEditor } from "@/components/SimulationEditor";

export default function SimulationPage({ params }: { params: { id: string } }) {
  return <SimulationEditor assetId={params.id} />;
}

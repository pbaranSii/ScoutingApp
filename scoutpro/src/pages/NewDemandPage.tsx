import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DemandForm } from "@/features/demands/components/DemandForm";

export function NewDemandPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <PageHeader
        title="Nowe zapotrzebowanie"
        subtitle="Wypełnij formularz, aby zdefiniować potrzebę rekrutacyjną"
      />
      <DemandForm mode="create" onSuccess={() => navigate("/demands")} />
    </div>
  );
}

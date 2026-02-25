import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { DemandForm } from "@/features/demands/components/DemandForm";

export function NewDemandPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto w-full max-w-[960px] space-y-4 min-h-[400px]">
      <PageHeader
        title="Nowe zapotrzebowanie"
        subtitle="Wypełnij formularz, aby zdefiniować potrzebę rekrutacyjną"
      />
      <div className="h-px bg-slate-200" />
      <DemandForm mode="create" onSuccess={() => navigate("/demands")} />
    </div>
  );
}

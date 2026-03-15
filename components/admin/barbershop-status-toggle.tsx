"use client";

import { useRouter } from "next/navigation";
import { getValidationErrorMessageWithNested } from "@/lib/action-errors";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { adminSetBarbershopActiveAction } from "@/actions/admin-set-barbershop-active";
import { Button } from "@/components/ui/button";

interface BarbershopStatusToggleProps {
  barbershopId: string;
  isActive: boolean;
}

const BarbershopStatusToggle = ({
  barbershopId,
  isActive,
}: BarbershopStatusToggleProps) => {
  const router = useRouter();
  const { executeAsync, isPending } = useAction(adminSetBarbershopActiveAction);

  const handleToggle = async () => {
    const result = await executeAsync({
      barbershopId,
      isActive: !isActive,
    });

    const validationError = getValidationErrorMessageWithNested(result.validationErrors);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (result.serverError || !result.data) {
      toast.error("Falha ao atualizar status da barbearia.");
      return;
    }

    toast.success(result.data.isActive ? "Barbearia ativada." : "Barbearia desativada.");
    router.refresh();
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={isActive ? "destructive" : "outline"}
      disabled={isPending}
      onClick={handleToggle}
    >
      {isPending ? "Salvando..." : isActive ? "Desativar" : "Ativar"}
    </Button>
  );
};

export default BarbershopStatusToggle;

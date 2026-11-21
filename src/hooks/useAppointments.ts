import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsService, AppointmentStatus } from "@/services/appointments";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { toast } from "sonner";

/**
 * Hook for administrative appointment operations.
 */
export function useAppointments(date?: string) {
  const { currentBarbershop } = useCurrentBarbershop();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['appointments', date, currentBarbershop?.id],
    queryFn: () => appointmentsService.getAppointmentsByDate(
      date!, 
      currentBarbershop!.id,
      currentBarbershop!.timezone
    ),
    enabled: !!date && !!currentBarbershop?.id,
  });

  const createMutation = useMutation({
    mutationFn: (params: Parameters<typeof appointmentsService.createAdminAppointment>[0]) => 
      appointmentsService.createAdminAppointment(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['appointments', variables.date, variables.barbershopId] 
      });
      queryClient.invalidateQueries({ queryKey: ['availability-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['busy-slots'] });
      toast.success("Agendamento realizado com sucesso.");
    },
    onError: (err: any) => {
      const raw = String(err?.message || "");
      if (/SLOT_TAKEN|já ocupado|acabou de ser reservado/i.test(raw)) {
        toast.error("Este horário acabou de ser reservado. Escolha outro horário disponível.");
      } else {
        toast.error(raw || "Erro ao realizar agendamento.");
      }
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => 
      appointmentsService.updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['busy-slots'] });
      toast.success("Status atualizado.");
    }
  });

  return { 
    ...query, 
    createAppointment: createMutation.mutateAsync, 
    updateStatus: updateStatusMutation.mutate 
  };
}

/**
 * Hook for public booking operations.
 */
export function usePublicBooking() {
  const queryClient = useQueryClient();

  const bookingMutation = useMutation({
    mutationFn: appointmentsService.createPublicAppointment,
    onSuccess: () => {
      // Invalidate admin + availability views if any are open
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['busy-slots'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['availability-appointments'] });
      toast.success("Agendamento confirmado com sucesso!");
    },
    onError: (err: any) => {
      // The caller renders the user-facing message (slot taken vs generic failure)
      console.error("Booking error:", err);
    }
  });

  return {
    confirmBooking: bookingMutation.mutateAsync,
    isBooking: bookingMutation.isPending,
    error: bookingMutation.error
  };
}

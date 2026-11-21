import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService, CustomerInsert, CustomerUpdate } from "@/services/customers";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { toast } from "sonner";

export function useCustomers() {
  const { currentBarbershop } = useCurrentBarbershop();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["customers", currentBarbershop?.id],
    queryFn: () => customersService.getCustomers(currentBarbershop!.id),
    enabled: !!currentBarbershop?.id,
  });

  const createMutation = useMutation({
    mutationFn: (customer: CustomerInsert & { barbershop_id: string }) => customersService.createCustomer(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", currentBarbershop?.id] });
      toast.success("Cliente cadastrado com sucesso.");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("Já existe um cliente cadastrado com este telefone.");
      } else {
        toast.error(error.message || "Erro ao cadastrar cliente.");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, customer }: { id: string; customer: CustomerUpdate }) =>
      customersService.updateCustomer(id, customer),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers", currentBarbershop?.id] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
      toast.success("Cliente atualizado.");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("Este telefone já pertence a outro cliente.");
      } else {
        toast.error("Erro ao atualizar cliente.");
      }
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => customersService.deactivateCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", currentBarbershop?.id] });
      toast.success("Cliente desativado.");
    },
    onError: () => toast.error("Erro ao desativar cliente."),
  });

  return {
    ...query,
    createCustomer: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutateAsync,
    deactivateCustomer: deactivateMutation.mutateAsync,
  };
}

export function useCustomerDetails(id: string) {
  const queryClient = useQueryClient();

  const detailsQuery = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersService.getCustomerById(id),
    enabled: !!id,
  });

  const appointmentsQuery = useQuery({
    queryKey: ["customer-appointments", id],
    queryFn: () => customersService.getCustomerAppointments(id),
    enabled: !!id,
  });

  const statsQuery = useQuery({
    queryKey: ["customer-stats", id],
    queryFn: () => customersService.getCustomerStats(id),
    enabled: !!id,
  });

  return {
    customer: detailsQuery.data,
    isLoading: detailsQuery.isLoading || appointmentsQuery.isLoading || statsQuery.isLoading,
    appointments: appointmentsQuery.data || [],
    stats: statsQuery.data,
    refetch: () => {
      detailsQuery.refetch();
      appointmentsQuery.refetch();
      statsQuery.refetch();
    }
  };
}

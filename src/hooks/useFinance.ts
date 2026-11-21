import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService, PaymentMethod, PaymentStatus, TransactionType } from "@/services/finance";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { toast } from "sonner";
import { startOfDay, endOfDay, format } from "date-fns";

export function useFinance(startDate?: string, endDate?: string) {
  const { currentBarbershop } = useCurrentBarbershop();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ['financial-transactions', startDate, endDate, currentBarbershop?.id],
    queryFn: () => financeService.getTransactions(startDate!, endDate!, currentBarbershop!.id),
    enabled: !!startDate && !!endDate && !!currentBarbershop?.id,
  });

  const registerPaymentMutation = useMutation({
    mutationFn: financeService.registerPayment,
    onSuccess: (result: any) => {
      // result is the RPC return object: { success, payment_id, transaction_id, message }
      if (result?.success) {
        // Full cache invalidation to ensure UI reflects real-time data
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
        queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
        queryClient.invalidateQueries({ queryKey: ['payments-pending-total'] });
        queryClient.invalidateQueries({ queryKey: ['cash-session'] });
        queryClient.invalidateQueries({ queryKey: ['cash-history'] });
        queryClient.invalidateQueries({ queryKey: ['current-cash-session'] });
        
        toast.success(result.message || "Atendimento concluído e pagamento registrado.");
      } else {
        // If RPC returned success: false but didn't throw, handle it here
        toast.error(result?.message || "Não foi possível finalizar o atendimento.");
      }
    },
    onError: (err: any) => {
      console.error("Technical error in registerPayment mutation:", err);
      // We let the caller handle the UI feedback if they use mutateAsync
    }
  });

  const createTransactionMutation = useMutation({
    mutationFn: (params: any) => financeService.createTransaction({ ...params, barbershopId: currentBarbershop!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success("Movimentação registrada.");
    }
  });

  const cancelTransactionMutation = useMutation({
    mutationFn: financeService.cancelTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success("Movimentação cancelada.");
    }
  });

  return {
    transactions: transactionsQuery.data || [],
    isLoadingTransactions: transactionsQuery.isLoading,
    registerPayment: registerPaymentMutation.mutateAsync,
    isRegisteringPayment: registerPaymentMutation.isPending,
    createTransaction: createTransactionMutation.mutateAsync,
    cancelTransaction: cancelTransactionMutation.mutateAsync,
  };
}

export function usePendingPayments() {
  const { currentBarbershop } = useCurrentBarbershop();
  return useQuery({
    queryKey: ['payments-pending-total', currentBarbershop?.id],
    queryFn: () => financeService.getPendingTotal(currentBarbershop!.id),
    enabled: !!currentBarbershop?.id,
  });
}


export function useCashSession() {
  const { currentBarbershop } = useCurrentBarbershop();
  const queryClient = useQueryClient();

  const currentSessionQuery = useQuery({
    queryKey: ['current-cash-session', currentBarbershop?.id],
    queryFn: () => financeService.getCurrentCashSession(currentBarbershop!.id),
    enabled: !!currentBarbershop?.id,
  });

  const historyQuery = useQuery({
    queryKey: ['cash-history', currentBarbershop?.id],
    queryFn: () => financeService.getCashHistory(currentBarbershop!.id),
    enabled: !!currentBarbershop?.id,
  });

  const openMutation = useMutation({
    mutationFn: ({ balance, notes }: { balance: number; notes?: string }) => 
      financeService.openCashSession({ openingBalance: balance, notes: notes || null, barbershopId: currentBarbershop!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-cash-session'] });
      toast.success("Caixa aberto.");
    }
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, balance, notes }: { id: string; balance: number; notes?: string }) => 
      financeService.closeCashSession(id, balance, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-cash-session'] });
      queryClient.invalidateQueries({ queryKey: ['cash-history'] });
      toast.success("Caixa fechado.");
    }
  });

  return {
    currentSession: currentSessionQuery.data,
    isLoadingSession: currentSessionQuery.isLoading,
    history: historyQuery.data || [],
    openCash: openMutation.mutateAsync,
    closeCash: closeMutation.mutateAsync,
    isOpening: openMutation.isPending,
    isClosing: closeMutation.isPending,
  };
}

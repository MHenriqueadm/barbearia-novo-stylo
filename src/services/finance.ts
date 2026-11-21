import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { getTenantDayBoundaries } from "@/lib/timezone";

export type Payment = Database['public']['Tables']['payments']['Row'];
export type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row'];
export type CashSession = Database['public']['Tables']['cash_sessions']['Row'];

export type PaymentMethod = 'cash' | 'pix' | 'debit_card' | 'credit_card' | 'pending' | 'other';
export type PaymentStatus = 'paid' | 'pending' | 'cancelled';
export type TransactionType = 'income' | 'expense';

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit_card: 'Cartão de débito',
  credit_card: 'Cartão de crédito',
  pending: 'Pendente',
  other: 'Outro'
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  cancelled: 'Cancelado'
};

export interface RPCResult {
  success: boolean;
  message?: string;
  payment_id?: string;
  transaction_id?: string;
}

export const financeService = {
  // Payments
  registerPayment: async (params: {
    appointmentId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    notes?: string;
  }): Promise<RPCResult> => {
    const { data, error } = await supabase.rpc('register_appointment_payment', {
      p_appointment_id: params.appointmentId,
      p_amount: params.amount,
      p_payment_method: params.paymentMethod,
      p_status: params.status,
      p_notes: params.notes || ""
    });

    if (error) throw error;
    // Cast to unknown first to safely cast to RPCResult from Json
    return (data as unknown) as RPCResult;
  },

  getPaymentByAppointment: async (appointmentId: string) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  getPendingTotal: async (barbershopId: string) => {
    const { data, error } = await supabase
      .from('payments')
      .select('amount')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'pending');

    if (error) throw error;
    return data.reduce((acc, p) => acc + Number(p.amount), 0);
  },


  // Transactions
  getTransactions: async (startDate: string, endDate: string, barbershopId: string) => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'active')
      .gte('occurred_at', startDate)
      .lte('occurred_at', endDate)
      .order('occurred_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  createTransaction: async (params: {
    type: TransactionType;
    description: string;
    amount: number;
    category?: string;
    paymentMethod?: string;
    occurredAt: string;
    notes?: string;
    barbershopId: string;
  }) => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert({
        type: params.type,
        description: params.description,
        amount: params.amount,
        category: params.category || null,
        payment_method: params.paymentMethod || null,
        occurred_at: params.occurredAt,
        notes: params.notes || null,
        status: 'active',
        barbershop_id: params.barbershopId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  cancelTransaction: async (id: string) => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cash Sessions
  getCurrentCashSession: async (barbershopId: string) => {
    const { data, error } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('status', 'open')
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  openCashSession: async (params: { openingBalance: number, notes?: string | null, barbershopId: string }) => {
    const { data, error } = await supabase
      .from('cash_sessions')
      .insert({
        opened_at: new Date().toISOString(),
        opening_balance: params.openingBalance,
        status: 'open',
        notes: params.notes || null,
        barbershop_id: params.barbershopId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  closeCashSession: async (id: string, countedBalance: number, notes?: string) => {
    const { data: session } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (!session) throw new Error("Session not found");

    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('payment_method', 'cash')
      .eq('status', 'active')
      .gte('occurred_at', session.opened_at);

    const cashIncome = transactions
      ?.filter(t => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    
    const cashExpense = transactions
      ?.filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount), 0) || 0;

    const expectedBalance = Number(session.opening_balance) + cashIncome - cashExpense;
    const difference = countedBalance - expectedBalance;

    const { data, error } = await supabase
      .from('cash_sessions')
      .update({
        closed_at: new Date().toISOString(),
        expected_closing_balance: expectedBalance,
        counted_closing_balance: countedBalance,
        difference,
        status: 'closed',
        notes: notes || session.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getCashHistory: async (barbershopId: string) => {
    const { data, error } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('opened_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }
};

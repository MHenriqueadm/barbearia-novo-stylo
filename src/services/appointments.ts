import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { getTenantDayBoundaries } from "@/lib/timezone";

export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export const appointmentStatusMap: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu'
};

export const appointmentsService = {
  getAppointmentsByDate: async (date: string, barbershopId: string, timezone: string = 'America/Bahia'): Promise<Appointment[]> => {
    // Get boundaries in tenant timezone
    const { start, end } = getTenantDayBoundaries(date, timezone);

    const { data, error } = await supabase
      .from('appointments')
      .select('*, professionals(name)')
      .eq('barbershop_id', barbershopId)
      .gte('start_at', start)
      .lte('start_at', end)
      .order('start_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Returns the busy intervals (scheduled/confirmed) of a professional for a given
   * tenant day. Works for anon (public booking) and authenticated (admin) callers,
   * so availability uses exactly ONE source of truth.
   */
  getBusySlots: async (
    barbershopId: string,
    professionalId: string,
    date: string,
    timezone: string = 'America/Bahia'
  ): Promise<Pick<Appointment, 'id' | 'professional_id' | 'start_at' | 'end_at' | 'status'>[]> => {
    const { start, end } = getTenantDayBoundaries(date, timezone);

    const { data, error } = await supabase.rpc('get_public_busy_slots', {
      p_barbershop_id: barbershopId,
      p_professional_id: professionalId,
      p_start: start,
      p_end: end,
    });

    if (error) throw error;
    return (data as any[]) || [];
  },

  createAppointment: async (appointment: AppointmentInsert): Promise<Appointment> => {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Securely creates an appointment from the public booking page.
   * This uses a database function (RPC) to prevent race conditions and enforce business rules.
   */
  createPublicAppointment: async (params: {
    serviceId: string;
    professionalId: string;
    startAt: string;
    customerName: string;
    customerPhone: string;
    notes?: string;
    barbershopId: string;
  }) => {
    const { data, error } = await supabase.rpc('create_public_appointment', {
      p_service_id: params.serviceId,
      p_professional_id: params.professionalId,
      p_start_at: params.startAt,
      p_customer_name: params.customerName,
      p_customer_phone: params.customerPhone,
      p_notes: params.notes || "",
      p_barbershop_id: params.barbershopId
    });

    if (error) throw error;
    return data;
  },

  updateAppointmentStatus: async (id: string, status: AppointmentStatus): Promise<Appointment> => {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateAppointment: async (id: string, appointment: Partial<Appointment>): Promise<Appointment> => {
    const { data, error } = await supabase
      .from('appointments')
      .update({ ...appointment, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  cancelAppointment: async (id: string): Promise<Appointment> => {
    return appointmentsService.updateAppointmentStatus(id, 'cancelled');
  },

  createAdminAppointment: async (params: {
    professionalId: string;
    serviceId: string;
    customerName: string;
    customerPhone: string;
    customerPhoneNormalized: string;
    startAt: string;
    date: string; // Adicionado para invalidação de cache precisa
    endAt: string;
    notes?: string;
    barbershopId: string;
    serviceNameSnapshot: string;
    servicePriceSnapshot: number;
    serviceDurationSnapshot: number;
  }) => {
    const { data, error } = await supabase.rpc('create_admin_appointment', {
      p_professional_id: params.professionalId,
      p_service_id: params.serviceId,
      p_customer_name: params.customerName,
      p_customer_phone: params.customerPhone,
      p_customer_phone_normalized: params.customerPhoneNormalized,
      p_start_at: params.startAt,
      p_end_at: params.endAt,
      p_notes: params.notes || "",
      p_barbershop_id: params.barbershopId,
      p_service_name_snapshot: params.serviceNameSnapshot,
      p_service_price_snapshot: params.servicePriceSnapshot,
      p_service_duration_snapshot: params.serviceDurationSnapshot
    });

    if (error) throw error;
    return data;
  }
};

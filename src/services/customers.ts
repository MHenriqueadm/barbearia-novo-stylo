import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { normalizePhone } from "@/utils/phone";

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export const customersService = {
  getCustomers: async (barbershopId: string): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  findCustomerByPhone: async (phone: string, barbershopId: string): Promise<Customer | null> => {
    const normalized = normalizePhone(phone);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('phone_normalized', normalized)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  createCustomer: async (customer: CustomerInsert): Promise<Customer> => {
    const normalized = normalizePhone(customer.phone);
    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...customer,
        phone_normalized: normalized,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateCustomer: async (id: string, customer: CustomerUpdate): Promise<Customer> => {
    const updateData: any = { ...customer, updated_at: new Date().toISOString() };
    if (customer.phone) {
      updateData.phone_normalized = normalizePhone(customer.phone);
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deactivateCustomer: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('customers')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  getCustomerAppointments: async (customerId: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        professionals(name)
      `)
      .eq('customer_id', customerId)
      .order('start_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getCustomerStats: async (customerId: string) => {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('status, start_at, service_price_snapshot')
      .eq('customer_id', customerId);

    if (error) throw error;
    if (!appointments) return { totalAppointments: 0, lastVisit: null, nextAppointment: null, totalSpent: 0 };

    const completed = appointments.filter(a => a.status === 'completed');
    const now = new Date();
    
    const upcoming = appointments
      .filter(a => 
        ['scheduled', 'confirmed'].includes(a.status) && 
        a.start_at && 
        new Date(a.start_at) > now
      )
      .sort((a, b) => new Date(a.start_at || "").getTime() - new Date(b.start_at || "").getTime());

    const sortedCompleted = completed
      .filter((a) => a.start_at !== null && a.start_at !== undefined)
      .sort((a, b) => new Date(b.start_at!).getTime() - new Date(a.start_at!).getTime());

    const firstUpcoming = upcoming.length > 0 ? upcoming[0] : null;
    const firstCompleted = sortedCompleted.length > 0 ? sortedCompleted[0] : null;

    return {
      totalAppointments: completed.length,
      lastVisit: firstCompleted ? (firstCompleted.start_at as string | null) : null,
      nextAppointment: firstUpcoming ? (firstUpcoming.start_at as string | null) : null,
      totalSpent: completed.reduce((acc, curr) => acc + Number(curr.service_price_snapshot || 0), 0)
    };
  }
};

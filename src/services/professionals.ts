import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Professional = Database['public']['Tables']['professionals']['Row'];
export type ProfessionalService = Database['public']['Tables']['professional_services']['Row'];
export type ProfessionalSchedule = Database['public']['Tables']['professional_schedules']['Row'];
export type ProfessionalBreak = Database['public']['Tables']['professional_breaks']['Row'];
export type ProfessionalBlock = Database['public']['Tables']['professional_blocks']['Row'];

export const professionalsService = {
  getProfessionals: async (barbershopId: string): Promise<Professional[]> => {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  },

  getProfessionalsByService: async (barbershopId: string, serviceId: string): Promise<Professional[]> => {
    const { data: links, error: linkError } = await supabase
      .from('professional_services')
      .select('professional_id')
      .eq('service_id', serviceId)
      .eq('barbershop_id', barbershopId);

    if (linkError) throw linkError;
    if (!links || links.length === 0) return [];

    const linkedIds = links.map(l => l.professional_id);

    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .in('id', linkedIds)
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  },

  createProfessional: async (professional: any): Promise<Professional> => {
    const { data, error } = await supabase.from('professionals').insert(professional).select().single();
    if (error) throw error;
    return data;
  },

  updateProfessional: async (id: string, professional: Partial<Professional>): Promise<Professional> => {
    const { data, error } = await supabase.from('professionals').update(professional).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  toggleProfessionalStatus: async (id: string, active: boolean): Promise<Professional> => {
    const { data, error } = await supabase.from('professionals').update({ active }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  getProfessionalServices: async (professionalId: string): Promise<ProfessionalService[]> => {
    const { data, error } = await supabase.from('professional_services').select('*').eq('professional_id', professionalId);
    if (error) throw error;
    return data;
  },

  setProfessionalServices: async (professionalId: string, serviceIds: string[], barbershopId: string): Promise<void> => {
    await supabase.from('professional_services').delete().eq('professional_id', professionalId);
    
    if (serviceIds.length === 0) return;

    const { error } = await supabase.from('professional_services').insert(
      serviceIds.map(serviceId => ({ 
        professional_id: professionalId, 
        service_id: serviceId,
        barbershop_id: barbershopId 
      }))
    );
    if (error) throw error;
  },

  getProfessionalSchedule: async (professionalId: string): Promise<ProfessionalSchedule[]> => {
    const { data, error } = await supabase.from('professional_schedules').select('*').eq('professional_id', professionalId);
    if (error) throw error;
    return data;
  },

  updateProfessionalSchedule: async (professionalId: string, weekday: number, schedule: Partial<ProfessionalSchedule>): Promise<ProfessionalSchedule> => {
    const { data: existing } = await supabase.from('professional_schedules').select('id').eq('professional_id', professionalId).eq('weekday', weekday).maybeSingle();
    
    if (existing) {
      const { data, error } = await supabase.from('professional_schedules').update(schedule).eq('id', existing.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from('professional_schedules').insert({ 
        ...schedule, 
        professional_id: professionalId, 
        weekday,
        start_time: schedule.start_time || '08:00',
        end_time: schedule.end_time || '18:00'
      } as any).select().single();

      if (error) throw error;
      return data;
    }
  },

  resetProfessionalSchedule: async (professionalId: string, weekday: number): Promise<void> => {
    const { error } = await supabase.from('professional_schedules').delete().eq('professional_id', professionalId).eq('weekday', weekday);
    if (error) throw error;
  },

  getProfessionalBreaks: async (professionalId: string): Promise<ProfessionalBreak[]> => {
    const { data, error } = await supabase.from('professional_breaks').select('*').eq('professional_id', professionalId).order('start_time', { ascending: true });
    if (error) throw error;
    return data;
  },

  createProfessionalBreak: async (brk: any): Promise<ProfessionalBreak> => {
    const { data, error } = await supabase.from('professional_breaks').insert(brk).select().single();
    if (error) throw error;
    return data;
  },

  updateProfessionalBreak: async (id: string, brk: Partial<ProfessionalBreak>): Promise<ProfessionalBreak> => {
    const { data, error } = await supabase.from('professional_breaks').update(brk).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  deleteProfessionalBreak: async (id: string): Promise<void> => {
    const { error } = await supabase.from('professional_breaks').delete().eq('id', id);
    if (error) throw error;
  },

  getProfessionalBlocks: async (professionalId: string): Promise<ProfessionalBlock[]> => {
    const { data, error } = await supabase.from('professional_blocks').select('*').eq('professional_id', professionalId).order('start_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  createProfessionalBlock: async (block: any): Promise<ProfessionalBlock> => {
    const { data, error } = await supabase.from('professional_blocks').insert(block).select().single();
    if (error) throw error;
    return data;
  },

  deleteProfessionalBlock: async (id: string): Promise<void> => {
    const { error } = await supabase.from('professional_blocks').delete().eq('id', id);
    if (error) throw error;
  }
};

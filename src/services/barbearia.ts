import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Barbershop = Database['public']['Tables']['barbershops']['Row'];
export type BarbershopSettings = Database['public']['Tables']['barbershop_settings']['Row'];
export type BusinessHour = Database['public']['Tables']['business_hours']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type BusinessBreak = Database['public']['Tables']['business_breaks']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];

export const settingsService = {
  getSettings: async (barbershopId: string): Promise<BarbershopSettings | null> => {
    const { data, error } = await supabase
      .from('barbershop_settings')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single();
    
    if (error) throw error;
    return data;
  },

  getBarbershopSettings: async (barbershopId: string): Promise<BarbershopSettings | null> => {
    return settingsService.getSettings(barbershopId);
  },

  updateBarbershopSettings: async ({ id, settings }: { id: string; settings: Partial<BarbershopSettings & Barbershop> }): Promise<BarbershopSettings> => {
    // Determine which fields go to which table
    // Identity fields are duplicated in both tables to ensure data integrity during migration
    const barbershopFields = ['name', 'slug', 'logo_url'];
    const barbershopUpdates: any = {};
    const settingsUpdates: any = {};

    Object.entries(settings).forEach(([key, value]) => {
      // Basic serializable check to avoid circular structures from React events
      if (value !== null && typeof value === 'object' && !(typeof File !== 'undefined' && (value as any) instanceof File)) {
        // If it's an object (like a MouseEvent), skip it
        return;
      }

      if (barbershopFields.includes(key)) {
        barbershopUpdates[key] = value;
        // Also add to settingsUpdates to keep both tables in sync
        settingsUpdates[key] = value;
      } else {
        // Only add known fields to settingsUpdates to avoid sending the entire object if it was a MouseEvent
        const knownSettingsFields = [
          'phone', 'whatsapp', 'instagram', 'address', 'city', 'state', 
          'timezone', 'business_name', 'booking_enabled', 'slot_interval'
        ];
        if (knownSettingsFields.includes(key)) {
          settingsUpdates[key] = value;
        }
      }
    });

    // Update barbershops table if needed
    if (Object.keys(barbershopUpdates).length > 0) {
      // Final check for slug conflict in server-side logic
      if (barbershopUpdates.slug) {
        const { data: existingSlug } = await supabase
          .from('barbershops')
          .select('id')
          .eq('slug', barbershopUpdates.slug)
          .neq('id', id)
          .maybeSingle();
        
        if (existingSlug) {
          throw new Error("Este endereço já está sendo utilizado por outra barbearia.");
        }
      }

      const { error: shopError } = await supabase
        .from('barbershops')
        .update(barbershopUpdates)
        .eq('id', id);
      
      if (shopError) throw shopError;
    }

    // Update barbershop_settings table
    // Even if settingsUpdates is empty, we might want to return the current settings
    if (Object.keys(settingsUpdates).length > 0) {
      const { data, error } = await supabase
        .from('barbershop_settings')
        .update(settingsUpdates)
        .eq('barbershop_id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Return current settings if no fields were updated
    const settingsData = await settingsService.getSettings(id);
    if (!settingsData) throw new Error("Settings not found");
    return settingsData;
  },

  getBusinessHours: async (barbershopId: string): Promise<BusinessHour[]> => {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('weekday', { ascending: true });

    if (error) throw error;
    return data;
  },

  updateBusinessHour: async (id: string, hour: Partial<BusinessHour>): Promise<BusinessHour> => {
    const { data, error } = await supabase
      .from('business_hours')
      .update(hour)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getBusinessBreaks: async (barbershopId: string): Promise<BusinessBreak[]> => {
    const { data, error } = await supabase
      .from('business_breaks')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  createBusinessBreak: async (brk: Omit<BusinessBreak, 'id' | 'created_at' | 'updated_at' | 'barbershop_id'> & { barbershop_id: string }): Promise<BusinessBreak> => {
    const { data, error } = await supabase
      .from('business_breaks')
      .insert(brk)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateBusinessBreak: async (id: string, brk: Partial<BusinessBreak>): Promise<BusinessBreak> => {
    const { data, error } = await supabase
      .from('business_breaks')
      .update(brk)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteBusinessBreak: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('business_breaks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  uploadBarbershopAsset: async (file: File, path: string, barbershopId: string): Promise<string> => {
    if (!barbershopId) throw new Error("barbershopId é obrigatório para upload.");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `barbershops/${barbershopId}/${path}/${fileName}`;

    console.log(`[Storage] Iniciando upload: bucket=barbershop-assets, path=${filePath}`);

    const { data, error: uploadError } = await supabase.storage
      .from('barbershop-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[Storage] Erro no upload:', {
        status: (uploadError as any).status,
        code: (uploadError as any).code,
        message: uploadError.message,
        details: (uploadError as any).details,
        bucket: 'barbershop-assets',
        path: filePath
      });
      throw uploadError;
    }

    // Retorna o path relativo dentro do bucket
    return filePath;
  },

  uploadLogo: async (file: File, barbershopId: string): Promise<string> => {
    return settingsService.uploadBarbershopAsset(file, 'logos', barbershopId);
  },

  removeLogo: async (url: string): Promise<void> => {
    try {
      const pathMatch = url.match(/\/barbershop-assets\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        const fullPath = pathMatch[1].split('?')[0] || '';
        const filePath = decodeURIComponent(fullPath);
        if (filePath) {
          await supabase.storage.from('barbershop-assets').remove([filePath]);
        }
      }
    } catch (e) {
      console.error("Failed to delete logo from storage", e);
    }
  },

  uploadServiceImage: async (file: File, barbershopId: string): Promise<string> => {
    return settingsService.uploadBarbershopAsset(file, 'services', barbershopId);
  },

  removeServiceImage: async (url: string): Promise<void> => {
    try {
      const pathMatch = url.match(/\/barbershop-assets\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        const fullPath = pathMatch[1].split('?')[0] || '';
        const filePath = decodeURIComponent(fullPath);
        if (filePath) {
          await supabase.storage.from('barbershop-assets').remove([filePath]);
        }
      }
    } catch (e) {
      console.error("Failed to delete service image from storage", e);
    }
  },

  uploadProfessionalAvatar: async (file: File, barbershopId: string): Promise<string> => {
    return settingsService.uploadBarbershopAsset(file, 'professionals', barbershopId);
  },

  removeProfessionalAvatar: async (url: string): Promise<void> => {
    try {
      const pathMatch = url.match(/\/barbershop-assets\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        const fullPath = pathMatch[1].split('?')[0] || '';
        const filePath = decodeURIComponent(fullPath);
        if (filePath) {
          await supabase.storage.from('barbershop-assets').remove([filePath]);
        }
      }
    } catch (e) {
      console.error("Failed to delete professional avatar from storage", e);
    }
  }
};

export const servicesService = {
  getServices: async (barbershopId: string): Promise<Service[]> => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  createService: async (service: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'barbershop_id'> & { barbershop_id: string }): Promise<Service> => {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateService: async (id: string, service: Partial<Service>): Promise<Service> => {
    const { data, error } = await supabase
      .from('services')
      .update(service)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteService: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const agendaService = {
  getAppointments: async (date: string, barbershopId: string): Promise<Appointment[]> => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .gte('start_at', `${date}T00:00:00`)
      .lte('start_at', `${date}T23:59:59`)
      .order('start_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

export const barbershopService = {
  getBySlug: async (slug: string) => {
    // Normalizing slug to lowercase to ensure case-insensitive matching in Postgres
    const normalizedSlug = slug.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('barbershops')
      .select('*, barbershop_settings(timezone)')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const shopData = data as any;
    return {
      ...shopData,
      timezone: shopData.barbershop_settings?.[0]?.timezone || shopData.barbershop_settings?.timezone
    };
  }
};


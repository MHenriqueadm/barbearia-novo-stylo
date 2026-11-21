import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  timezone?: string;
}

interface BarbershopContextType {
  currentBarbershop: Barbershop | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const BarbershopContext = createContext<BarbershopContextType | undefined>(undefined);

export function BarbershopProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [currentBarbershop, setCurrentBarbershop] = useState<Barbershop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBarbershop = async (silent = false) => {
    if (!isAuthenticated || !user) {
      setCurrentBarbershop(null);
      setIsLoading(false);
      return;
    }

    try {
      if (!silent) setIsLoading(true);
      
      // 1. Get user's membership
      // Use maybeSingle to avoid 406/PGRST116 when no membership exists
      const { data: membership, error: memberError } = await supabase
        .from('barbershop_users')
        .select('barbershop_id')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (memberError) {
        console.error('Error fetching membership:', memberError);
        throw memberError;
      }
      
      if (!membership) {
        setCurrentBarbershop(null);
        setIsLoading(false);
        return;
      }

      // 2. Get barbershop details including timezone from settings
      const { data: barbershop, error: shopError } = await supabase
        .from('barbershops')
        .select('*, barbershop_settings(timezone)')
        .eq('id', membership.barbershop_id)
        .single();

      if (shopError) throw shopError;

      const shopData = barbershop as any;
      setCurrentBarbershop({
        ...shopData,
        timezone: shopData.barbershop_settings?.[0]?.timezone || shopData.barbershop_settings?.timezone
      });
    } catch (err: any) {
      console.error('Error loading barbershop:', err);
      // Se não for o erro de "nenhuma linha encontrada" (que é normal para novos usuários),
      // lançamos o erro real para ser capturado pela árvore de erros do TanStack.
      if (err.code !== 'PGRST116') {
        setError(err);
      } else {
        setCurrentBarbershop(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBarbershop();
  }, [user, isAuthenticated]);

  useEffect(() => {
    const handleUpdate = () => loadBarbershop(true);
    window.addEventListener('barbershop-updated', handleUpdate);
    return () => window.removeEventListener('barbershop-updated', handleUpdate);
  }, [user, isAuthenticated]);

  return (
    <BarbershopContext.Provider value={{ 
      currentBarbershop, 
      isLoading, 
      error,
      refresh: () => loadBarbershop(true)
    }}>
      {children}
    </BarbershopContext.Provider>
  );
}

export function useCurrentBarbershop() {
  const context = useContext(BarbershopContext);
  if (context === undefined) {
    throw new Error('useCurrentBarbershop must be used within a BarbershopProvider');
  }
  return context;
}

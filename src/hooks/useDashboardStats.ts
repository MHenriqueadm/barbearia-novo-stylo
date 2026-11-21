import { useState, useEffect } from 'react';
import { agendaService } from '@/services/barbearia';
import { useCurrentBarbershop } from '@/contexts/BarbershopContext';
import { format } from 'date-fns';

export function useDashboardStats() {
  const { currentBarbershop } = useCurrentBarbershop();
  const [stats, setStats] = useState<{
    agendamentosHoje: number;
    faturamentoHoje: number;
    clientesAtendidos: number;
    proximoAtendimento: string | null;
  }>({
    agendamentosHoje: 0,
    faturamentoHoje: 0,
    clientesAtendidos: 0,
    proximoAtendimento: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!currentBarbershop?.id) return;
      
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const appointments = await agendaService.getAppointments(today, currentBarbershop.id);
        
        const completed = appointments.filter(a => a.status === 'completed');
        const faturamento = completed.reduce((acc, a) => acc + Number(a.service_price_snapshot || 0), 0);
        
        setStats({
          agendamentosHoje: appointments.length,
          faturamentoHoje: faturamento,
          clientesAtendidos: completed.length,
          proximoAtendimento: appointments.find(a => ['scheduled', 'confirmed'].includes(a.status || ''))?.start_at || null,
        });
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dashboard stats", error);
        setLoading(false);
      }
    }
    loadStats();
  }, [currentBarbershop?.id]);

  return { stats, loading };
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { PlusCircle, UserPlus, TrendingUp, Share2, ClipboardList, Clock, User, Scissors, CheckCircle2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { appointmentsService } from "@/services/appointments";
import { useFinance } from "@/hooks/useFinance";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { format, isAfter, parseISO, startOfDay, endOfDay } from "date-fns";
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { 
  getTenantNow, 
  formatTenantTime, 
  getTenantDayBoundaries, 
  isFutureAppointment,
  DEFAULT_TIMEZONE
} from "@/lib/timezone";
import { Skeleton } from "@/components/ui/skeleton";
import { appointmentStatusMap } from "@/services/appointments";
import { cn } from "@/lib/utils";
import { normalizePhone } from "@/utils/phone";
import { toast } from "sonner";



export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { currentBarbershop } = useCurrentBarbershop();

  const timezone = currentBarbershop?.timezone || DEFAULT_TIMEZONE;
  const now = getTenantNow(timezone);
  const dateStr = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
  
  // Define local day boundaries for the tenant's timezone
  const { start: localStart, end: localEnd } = getTenantDayBoundaries(now, timezone);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', dateStr, currentBarbershop?.id],
    queryFn: () => appointmentsService.getAppointmentsByDate(dateStr, currentBarbershop!.id, timezone),
    enabled: !!currentBarbershop?.id
  });

  // Agendamentos hoje: scheduled, confirmed, completed, no_show (excludes cancelled)
  const todayAppointments = appointments.filter(a => ['scheduled', 'confirmed', 'completed', 'no_show'].includes(a.status));
  const completedToday = appointments.filter(a => a.status === 'completed');
  
  const { transactions } = useFinance(localStart, localEnd);

  // Faturamento hoje: only active income financial transactions
  const dailyRevenue = transactions
    .filter(t => t.type === 'income' && t.status === 'active')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  // Clientes atendidos hoje: clientes ÚNICOS com pelo menos 1 atendimento concluído.
  // Chave preferencial: customer_id. Fallback: telefone normalizado (apenas dígitos).
  const uniqueCustomersCount = new Set(
    completedToday
      .map(a => a.customer_id || (a.customer_phone ? `phone:${normalizePhone(a.customer_phone)}` : null))
      .filter((k): k is string => !!k)
  ).size;

  
  // Next appointment: only future scheduled/confirmed
  const nextAppointment = appointments
    .filter(a => ['scheduled', 'confirmed'].includes(a.status))
    .find(a => a.start_at && isFutureAppointment(a.start_at, timezone));

  const stats = [
    { label: "Agendamentos hoje", value: todayAppointments.length.toString(), sub: "agendamentos" },
    { label: "Faturamento hoje", value: `R$ ${dailyRevenue.toFixed(2).replace('.', ',')}`, sub: "realizado" },
    { label: "Clientes atendidos", value: uniqueCustomersCount.toString(), sub: "hoje" },
    { label: "Próximo atendimento", value: nextAppointment?.start_at ? formatTenantTime(nextAppointment.start_at, timezone) : "-", sub: nextAppointment ? nextAppointment.customer_name : "em breve" },
  ];

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
        <Skeleton className="h-20 w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!currentBarbershop) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground font-medium">Carregando informações da barbearia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-24 md:pb-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bom dia, {(user?.user_metadata as any)?.name?.split(' ')[0] || (user?.email?.split('@')[0]) || 'Usuário'}</h1>
          <p className="text-muted-foreground mt-1 text-lg">Aqui está o resumo de {currentBarbershop.name} hoje.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card p-5 rounded-xl border border-border flex flex-col justify-between h-32">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <div>
              <p className={cn(
                "text-2xl font-bold",
                stat.label === "Faturamento hoje" && "text-emerald-500"
              )}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Agenda de hoje</h2>
          </div>
          <div className="space-y-4">
            {appointments.length > 0 ? (
              appointments
                .filter(a => ['scheduled', 'confirmed', 'completed'].includes(a.status))
                .slice(0, 5)
                .map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{app.customer_name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{app.service_name_snapshot} • {app.start_at ? formatTenantTime(app.start_at, timezone) : '--:--'}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase",
                    app.status === 'confirmed' ? "bg-green-500/10 text-green-500" : 
                    app.status === 'completed' ? "bg-blue-500/10 text-blue-500" :
                    "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {appointmentStatusMap[app.status as keyof typeof appointmentStatusMap]}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">Nenhum atendimento agendado para hoje.</p>
              </div>
            )}
            {appointments.length > 5 && (
              <Link to="/agenda" className="block text-center text-xs text-primary hover:underline pt-2">
                Ver todos os agendamentos
              </Link>
            )}
          </div>
        </section>

        <div className="space-y-8">
          <section className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Atalhos rápidos</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/agenda" className="flex items-center gap-3 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors border border-border group">
                <PlusCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm font-medium">Agendar</span>
              </Link>
              <Link to="/clientes" className="flex items-center gap-3 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors border border-border group">
                <UserPlus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm font-medium">Novo Cliente</span>
              </Link>
              <Link to="/financeiro" className="flex items-center gap-3 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors border border-border group">
                <TrendingUp className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm font-medium">Movimentação</span>
              </Link>
              <Link to="/configuracoes" className="flex items-center gap-3 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors border border-border group">
                <Settings2 className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                <span className="text-sm font-medium">Ajustes</span>
              </Link>
            </div>
          </section>

          <section className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Link de agendamento</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Compartilhe este link com seus clientes para que eles agendem online.</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs truncate flex items-center text-muted-foreground">
                {typeof window !== 'undefined' ? `${window.location.origin}/${currentBarbershop.slug}/agendar` : `/${currentBarbershop.slug}/agendar`}
              </div>
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/${currentBarbershop.slug}/agendar`;
                  navigator.clipboard.writeText(url);
                  toast.success("Link copiado!");
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Copiar
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Settings2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}

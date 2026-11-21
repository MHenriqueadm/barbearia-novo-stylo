import { createFileRoute } from "@tanstack/react-router";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { useState, useMemo } from "react";
import { normalizePhone } from "@/utils/phone";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  User, 
  Scissors, 
  Phone, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  CreditCard,
  DollarSign
} from "lucide-react";
import { 
  format, 
  addDays, 
  subDays, 
  startOfDay, 
  parseISO, 
  isToday, 
  isSameDay,
  addMinutes
} from "date-fns";
import { 
  formatTenantTime, 
  parseTenantDateTime, 
  DEFAULT_TIMEZONE 
} from "@/lib/timezone";

import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAppointments } from "@/hooks/useAppointments";
import { useServices, useBarbershopSettings, useBusinessBreaks } from "@/hooks/useBarbearia";
import { useProfessionals, useProfessionalServices, useProfessionalSchedule, useProfessionalBreaks, useProfessionalBlocks } from "@/hooks/useProfessionals";
import { useFinance } from "@/hooks/useFinance";
import { PaymentDrawer } from "@/components/finance/PaymentDrawer";
import { appointmentStatusMap, AppointmentStatus, appointmentsService } from "@/services/appointments";
import { financeService, paymentMethodLabels, PaymentMethod } from "@/services/finance";
import { availabilityService, TimeSlot } from "@/services/availability";
import { customersService } from "@/services/customers";
import { agendaService } from "@/services/barbearia";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: AgendaPage,
});

function AgendaPage() {
  const { currentBarbershop } = useCurrentBarbershop();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: appointments = [], isLoading, updateStatus } = useAppointments(dateStr);
  const { professionals = [] } = useProfessionals();
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("all");

  const filteredAppointments = useMemo(() => {
    if (selectedProfessionalId === "all") return appointments;
    return appointments.filter(a => a.professional_id === selectedProfessionalId);
  }, [appointments, selectedProfessionalId]);

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 md:pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground text-sm">Organize e acompanhe seus atendimentos.</p>
        </div>
        <Button onClick={() => setIsNewBookingOpen(true)} className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo agendamento
        </Button>
      </header>

      <section className="bg-card rounded-xl border border-border p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevDay}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-start font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="ml-2">
              Hoje
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os profissionais</SelectItem>
                {professionals.filter((p: any) => p.active).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))
          ) : filteredAppointments.length > 0 ? (
            <div className="space-y-3">
              {filteredAppointments.map((app) => (
                <AppointmentCard key={app.id} appointment={app} onStatusChange={(status) => updateStatus({ id: app.id, status })} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border border-dashed rounded-xl">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Nenhum atendimento para este dia.</p>
              <Button variant="outline" size="sm" onClick={() => setIsNewBookingOpen(true)}>
                Novo agendamento
              </Button>
            </div>
          )}
        </div>
      </section>

      <NewBookingDrawer 
        isOpen={isNewBookingOpen} 
        onOpenChange={setIsNewBookingOpen} 
        defaultDate={selectedDate}
      />
    </div>
  );
}

function AppointmentCard({ appointment, onStatusChange }: { appointment: any, onStatusChange: (status: AppointmentStatus) => void }) {
  const { currentBarbershop } = useCurrentBarbershop();
  const timezone = currentBarbershop?.timezone || DEFAULT_TIMEZONE;
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', appointment.id],
    queryFn: () => financeService.getPaymentByAppointment(appointment.id),
    enabled: !!appointment.id
  });
  
  const payment = Array.isArray(payments) ? payments[0] : payments;

  const statusColors = {
    scheduled: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    cancelled: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    no_show: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };

  const statusIcons = {
    scheduled: <Clock className="w-3 h-3" />,
    confirmed: <CheckCircle2 className="w-3 h-3" />,
    completed: <CheckCircle2 className="w-3 h-3" />,
    cancelled: <XCircle className="w-3 h-3" />,
    no_show: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-500/20 transition-all duration-300 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-2 rounded-2xl text-blue-500 font-bold text-sm min-w-[70px] text-center shadow-inner">
          {formatTenantTime(appointment.start_at, timezone)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base tracking-tight">{appointment.customer_name}</h3>
            <span className={cn(
              "text-[9px] px-2 py-0.5 rounded-full font-bold border uppercase flex items-center gap-1 tracking-widest shadow-sm",
              statusColors[appointment.status as keyof typeof statusColors]
            )}>
              {statusIcons[appointment.status as keyof typeof statusIcons]}
              {appointmentStatusMap[appointment.status as keyof typeof appointmentStatusMap]}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Scissors className="w-3 h-3" /> {appointment.service_name_snapshot}</span>
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {appointment.professionals?.name || "Profissional"}</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {appointment.customer_phone}</span>
          </div>
          
          {payment && (
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border tracking-widest",
                payment.status === 'paid' 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"
              )}>
                {payment.status === 'paid' ? 'Pago' : 'Pendente'}
              </span>
              {payment.status === 'paid' && (
                <span className="text-[10px] text-muted-foreground font-medium italic">
                  via {paymentMethodLabels[payment.payment_method as PaymentMethod]}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Valor</p>
          <p className="font-bold text-base tracking-tighter">R$ {Number(appointment.service_price_snapshot).toFixed(2).replace('.', ',')}</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {appointment.status === 'scheduled' && (
              <DropdownMenuItem onClick={() => onStatusChange('confirmed')} className="text-green-500">
                Confirmar
              </DropdownMenuItem>
            )}
            {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
              <>
                <DropdownMenuItem onClick={() => setIsPaymentDrawerOpen(true)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Concluir atendimento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('no_show')}>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Não compareceu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('cancelled')} className="text-red-500">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </DropdownMenuItem>
              </>
            )}
            {appointment.status === 'completed' && !payment && (
              <DropdownMenuItem onClick={() => setIsPaymentDrawerOpen(true)} className="text-primary font-bold">
                <DollarSign className="w-4 h-4 mr-2" />
                Registrar Pagamento
              </DropdownMenuItem>
            )}
            {payment?.status === 'pending' && (
              <DropdownMenuItem onClick={() => setIsPaymentDrawerOpen(true)} className="text-primary font-bold">
                <CreditCard className="w-4 h-4 mr-2" />
                Receber agora
              </DropdownMenuItem>
            )}
            {['cancelled', 'no_show', 'completed'].includes(appointment.status) && (
              <DropdownMenuItem onClick={() => onStatusChange('scheduled')}>
                <History className="w-4 h-4 mr-2" />
                Reativar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <PaymentDrawer 
        isOpen={isPaymentDrawerOpen}
        onOpenChange={setIsPaymentDrawerOpen}
        appointment={appointment}
      />
    </div>
  );
}

function NewBookingDrawer({ isOpen, onOpenChange, defaultDate }: { isOpen: boolean, onOpenChange: (val: boolean) => void, defaultDate: Date }) {
  const { currentBarbershop } = useCurrentBarbershop();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceId: "",
    professionalId: "",
    date: format(defaultDate, "yyyy-MM-dd"),
    time: "",
    customerName: "",
    customerPhone: "",
    notes: ""
  });

  const { data: services = [] } = useServices();
  const { professionals = [] } = useProfessionals();
  const { createAppointment } = useAppointments(formData.date);
  

  // Fetch professionals breaks, blocks and schedules for availability
  const { data: profSchedule = [] } = useProfessionalSchedule(formData.professionalId);
  const { breaks: profBreaks = [] } = useProfessionalBreaks(formData.professionalId);
  const { data: profBlocks = [] } = useProfessionalBlocks(formData.professionalId);
  const { data: businessBreaks = [] } = useBusinessBreaks();
  
  // Use specialized appointments query for availability calculation
  const { data: existingApps = [] } = useQuery({
    queryKey: ["availability-appointments", formData.professionalId, formData.date, currentBarbershop?.id],
    queryFn: () => appointmentsService.getBusySlots(
      currentBarbershop!.id,
      formData.professionalId,
      formData.date,
      currentBarbershop!.timezone
    ),
    enabled: !!formData.professionalId && !!formData.date && !!currentBarbershop?.id
  });

  const availableSlotsQuery = useQuery({
    queryKey: ["available-slots", formData.professionalId, formData.serviceId, formData.date, profSchedule, profBreaks, profBlocks, existingApps, businessBreaks, currentBarbershop?.id],
    queryFn: () => availabilityService.getAvailableSlots({
      barbershopId: currentBarbershop!.id,
      professionalId: formData.professionalId,
      serviceId: formData.serviceId,
      date: formData.date,
      services,
      allBusinessBreaks: businessBreaks,
      allProfessionalsSchedules: profSchedule,
      allProfessionalsBreaks: profBreaks,
      allProfessionalsBlocks: profBlocks,
      existingAppointments: existingApps
    }),
    enabled: !!formData.professionalId && !!formData.serviceId && !!formData.date && !!currentBarbershop?.id
  });


  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const resetAndClose = () => {
    setStep(1);
    setFormData({
      serviceId: "",
      professionalId: "",
      date: format(defaultDate, "yyyy-MM-dd"),
      time: "",
      customerName: "",
      customerPhone: "",
      notes: ""
    });
    setFoundCustomer(null);
    onOpenChange(false);
  };

  const [foundCustomer, setFoundCustomer] = useState<any>(null);

  const handlePhoneChange = async (phone: string) => {
    setFormData(prev => ({ ...prev, customerPhone: phone }));
    if (phone.length >= 10) {
      const customer = await customersService.findCustomerByPhone(phone, currentBarbershop!.id);
      if (customer) {
        setFoundCustomer(customer);
        setFormData(prev => ({ ...prev, customerName: customer.name }));
      } else {
        setFoundCustomer(null);
      }
    } else {
      setFoundCustomer(null);
    }
  };

  const handleCreate = async () => {
    const service = services.find(s => s.id === formData.serviceId);
    if (!service) return;

    const timezone = currentBarbershop?.timezone || DEFAULT_TIMEZONE;
    const startAt = parseTenantDateTime(formData.date, formData.time, timezone).toISOString();
    const endAt = addMinutes(parseISO(startAt), service.duration_minutes).toISOString();

    try {
      await createAppointment({
        professionalId: formData.professionalId,
        serviceId: formData.serviceId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerPhoneNormalized: normalizePhone(formData.customerPhone),
        startAt: startAt,
        date: formData.date,
        endAt: endAt,
        notes: formData.notes,
        barbershopId: currentBarbershop!.id,
        serviceNameSnapshot: service.name,
        servicePriceSnapshot: Number(service.price),
        serviceDurationSnapshot: service.duration_minutes
      });
      resetAndClose();
    } catch (e: any) {
      console.error("DEBUG AGENDAMENTO:", {
        code: e.code,
        message: e.message,
        details: e.details,
        hint: e.hint,
        error: e
      });
    }
  };

  const selectedService = services.find(s => s.id === formData.serviceId);
  const selectedProf = professionals.find((p: any) => p.id === formData.professionalId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-slate-900 border-white/5 rounded-[2.5rem] p-8 overflow-hidden">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold tracking-tighter">Novo Agendamento</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 block">Escolha o serviço</Label>
              <div className="grid gap-3">
                {services.filter(s => s.active).map(s => (
                  <Button 
                    key={s.id} 
                    variant="ghost"
                    className={cn(
                      "justify-between h-auto py-5 px-6 rounded-2xl border transition-all",
                      formData.serviceId === s.id ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" : "bg-black/40 border-white/5 hover:border-white/10"
                    )}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, serviceId: s.id }));
                      handleNext();
                    }}
                  >
                    <div className="text-left">
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-[10px] opacity-70">{s.duration_minutes} min</p>
                    </div>
                    <span className="font-bold tracking-tighter text-lg">R$ {s.price.toFixed(2).replace('.', ',')}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 block">Escolha o profissional</Label>
              <div className="grid gap-3">
                {professionals.filter((p: any) => p.active).map((p: any) => (
                  <Button 
                    key={p.id} 
                    variant="ghost"
                    className={cn(
                      "justify-start h-auto py-5 px-6 gap-4 rounded-2xl border transition-all",
                      formData.professionalId === p.id ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" : "bg-black/40 border-white/5 hover:border-white/10"
                    )}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, professionalId: p.id }));
                      setFormData(prev => ({ ...prev, time: "" })); // Reset time when changing professional
                      handleNext();
                    }}

                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border",
                      formData.professionalId === p.id ? "bg-white/20 border-white/20" : "bg-slate-800 border-white/5"
                    )}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-[10px] opacity-70">{p.bio?.substring(0, 30)}...</p>
                    </div>
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={handlePrev} className="mt-4 text-slate-500 hover:text-white">Voltar</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 block">Data e Horário</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {format(parseISO(formData.date), "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={parseISO(formData.date)}
                      onSelect={(d) => d && setFormData(prev => ({ ...prev, date: format(d, "yyyy-MM-dd") }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {availableSlotsQuery.isLoading ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}
                </div>
              ) : availableSlotsQuery.data && availableSlotsQuery.data.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {availableSlotsQuery.data.map((slot: TimeSlot) => (
                    <Button
                      key={slot.time}
                      variant="ghost"
                      size="sm"
                      disabled={!slot.available}
                      className={cn(
                        "h-12 rounded-xl font-bold border transition-all",
                        slot.available 
                          ? formData.time === slot.time
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                            : "bg-black/40 border-white/5 text-slate-300 hover:border-blue-500/50"
                          : "opacity-10 grayscale border-transparent"
                      )}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, time: slot.time }));
                        handleNext();
                      }}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-center py-10 text-sm text-slate-500 font-medium">Indisponível para esta data.</p>
              )}
              <Button variant="ghost" size="sm" onClick={handlePrev} className="w-full text-slate-500 hover:text-white">Voltar</Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 block">Dados do Cliente</Label>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">WhatsApp / Telefone</Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 00000-0000" 
                    className="bg-black/40 border-white/10 h-12 rounded-2xl px-5 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    value={formData.customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                  />
                  {foundCustomer && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20 animate-in fade-in zoom-in duration-300">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                        {foundCustomer.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Cliente encontrado</p>
                        <p className="text-xs font-semibold truncate">{foundCustomer.name}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Nome completo</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: João Silva" 
                    className="bg-black/40 border-white/10 h-12 rounded-2xl px-5 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Observações (opcional)</Label>
                  <Input 
                    id="notes" 
                    placeholder="Algum detalhe importante..." 
                    className="bg-black/40 border-white/10 h-12 rounded-2xl px-5 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-blue-600/5 border border-blue-500/10 p-5 rounded-3xl space-y-1 mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Resumo</p>
                <div className="text-sm space-y-0.5">
                  <p className="font-bold tracking-tight">{selectedService?.name}</p>
                  <p className="text-slate-500 font-medium">{selectedProf?.name} • {format(parseISO(formData.date), "dd/MM")} às {formData.time}</p>
                  <p className="pt-2 text-blue-500 font-bold tracking-tighter text-lg">Total: R$ {selectedService?.price.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={handlePrev} className="flex-1 rounded-2xl h-14 text-slate-500 hover:text-white">Voltar</Button>
                <Button 
                  onClick={handleCreate} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                  disabled={!formData.customerName || !formData.customerPhone}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

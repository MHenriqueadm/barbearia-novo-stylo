import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getPublicAssetUrl } from "@/lib/storage";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { servicesService, settingsService } from "@/services/barbearia";
import { professionalsService } from "@/services/professionals";
import { availabilityService } from "@/services/availability";
import { usePublicBooking } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, addDays, startOfDay, isBefore, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseTenantDateTime } from "@/lib/timezone";
import { CheckCircle2, Scissors, User, Calendar as CalendarIcon, Clock, ChevronLeft, Phone, MessageSquare, Copy, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { appointmentsService } from "@/services/appointments";

export const Route = createFileRoute("/agendar")({
  component: AgendarPage,
  head: () => ({
    meta: [
      { title: "Agendar horário na barbearia | RESTYLE" },
      { name: "description", content: "Escolha o serviço, o profissional, a data e o horário e confirme seu agendamento na barbearia em poucos passos." },
      { property: "og:title", content: "Agendar horário na barbearia | RESTYLE" },
      { property: "og:description", content: "Reserve seu corte ou barba online: escolha serviço, profissional e horário disponível e receba o código de confirmação." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://joyful-code-burst.lovable.app/agendar" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://joyful-code-burst.lovable.app/agendar" }],
  }),
});

function AgendarPage() {
  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  // We are using a fixed barbershop UUID for now as specified in the prompt
  const barbershopId = "7a4b8c9e-1d2f-4a3b-8c9d-5e6f7a8b9c0d";

  const { confirmBooking, isBooking } = usePublicBooking();
  const { data: allBusinessBreaks = [] } = useQuery({
    queryKey: ["business-breaks", barbershopId],
    queryFn: () => settingsService.getBusinessBreaks(barbershopId),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["public-services", barbershopId],
    queryFn: () => servicesService.getServices(barbershopId),
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["public-professionals", barbershopId, selectedServiceId],
    queryFn: async () => {
      if (!selectedServiceId) {
        return professionalsService.getProfessionals(barbershopId);
      }
      return professionalsService.getProfessionalsByService(barbershopId, selectedServiceId);
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["barbershop-settings", barbershopId],
    queryFn: () => settingsService.getSettings(barbershopId),
  });

  const { data: profSchedules = [] } = useQuery({
    queryKey: ["professional-schedules", selectedProfessionalId],
    queryFn: () => professionalsService.getProfessionalSchedule(selectedProfessionalId!),
    enabled: !!selectedProfessionalId,
  });

  const { data: profBreaks = [] } = useQuery({
    queryKey: ["professional-breaks", selectedProfessionalId],
    queryFn: () => professionalsService.getProfessionalBreaks(selectedProfessionalId!),
    enabled: !!selectedProfessionalId,
  });

  const { data: profBlocks = [] } = useQuery({
    queryKey: ["professional-blocks", selectedProfessionalId],
    queryFn: () => professionalsService.getProfessionalBlocks(selectedProfessionalId!),
    enabled: !!selectedProfessionalId,
  });

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const { data: busySlots = [] } = useQuery({
    queryKey: ["busy-slots", dateStr, barbershopId, selectedProfessionalId],
    queryFn: () => appointmentsService.getBusySlots(barbershopId, selectedProfessionalId!, dateStr),
    enabled: !!dateStr && !!selectedProfessionalId && !!barbershopId,
  });

  const { data: availableSlots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: ["availability", selectedProfessionalId, selectedServiceId, dateStr, busySlots, allBusinessBreaks.length, barbershopId],
    queryFn: () => availabilityService.getAvailableSlots({
      barbershopId,
      professionalId: selectedProfessionalId!,
      serviceId: selectedServiceId!,
      date: dateStr,
      services,
      allBusinessBreaks,
      allProfessionalsSchedules: profSchedules,
      allProfessionalsBreaks: profBreaks,
      allProfessionalsBlocks: profBlocks,
      existingAppointments: busySlots as any[]
    }),
    enabled: !!selectedProfessionalId && !!selectedServiceId && !!dateStr && services.length > 0 && !!barbershopId,
  });

  const activeServices = services.filter((s) => s.active);
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedProfessional = (professionals as any[]).find(p => p.id === selectedProfessionalId);

  const handleBooking = async () => {
    console.log("Booking process started");
    if (!selectedServiceId || !selectedProfessionalId || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      console.log("Validation failed: missing required fields");
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      console.log("Preparing booking payload...");
      const startAt = parseTenantDateTime(format(selectedDate, 'yyyy-MM-dd'), selectedTime, 'America/Bahia').toISOString();
      
      console.log("Calling createPublicAppointment RPC...");
      const result = await confirmBooking({
        serviceId: selectedServiceId,
        professionalId: selectedProfessionalId,
        startAt,
        customerName,
        customerPhone,
        notes,
        barbershopId
      });
      
      console.log("RPC Success. Result:", result);
      setBookingResult(result);
      setStep(6);
    } catch (err: any) {
      console.error("Critical booking error:", err);
      toast.error(err.message || "Não foi possível confirmar o agendamento. Tente novamente.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success("Código copiado!");
  };

  const steps = [
    { id: 1, label: "Serviço", icon: Scissors },
    { id: 2, label: "Profissional", icon: User },
    { id: 3, label: "Data", icon: CalendarIcon },
    { id: 4, label: "Horário", icon: Clock },
    { id: 5, label: "Dados", icon: Phone },
  ];

  if (step === 6 && bookingResult) {
    return (
      <div className="min-h-screen bg-black text-white p-4 md:p-8 flex items-center justify-center animate-in zoom-in-95 duration-500">
        <div className="max-w-md w-full bg-slate-900 rounded-[2.5rem] border border-white/10 p-10 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-blue-400" />
          
          <div className="mx-auto w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
            <CheckCircle2 className="w-12 h-12 text-blue-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter">Reservado!</h1>
            <p className="text-slate-400 text-sm">Seu agendamento na {settings?.name || "RESTYLE"} foi confirmado.</p>
          </div>
          
          <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-4 text-left">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Serviço</span>
                <span className="font-semibold text-slate-200">{bookingResult.service_name}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Profissional</span>
                <span className="font-semibold text-slate-200">{bookingResult.professional_name}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Data</span>
                <span className="font-semibold text-slate-200">{format(new Date(bookingResult.start_at), "dd 'de' MMMM", { locale: ptBR })}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest block mb-1">Horário</span>
                <span className="font-semibold text-slate-200">{format(new Date(bookingResult.start_at), "HH:mm")}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Código RST</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-bold tracking-tighter text-blue-500">{bookingResult.confirmation_code}</span>
                <button onClick={() => copyToClipboard(bookingResult.confirmation_code)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl gap-3 text-base font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
              onClick={() => {
                const text = encodeURIComponent(`Olá, confirmo meu agendamento na ${settings?.name || "RESTYLE"}: ${bookingResult.service_name} em ${format(new Date(bookingResult.start_at), "dd/MM")} às ${format(new Date(bookingResult.start_at), "HH:mm")}. Cód: ${bookingResult.confirmation_code}`);
                window.open(`https://wa.me/${settings?.whatsapp?.replace(/\D/g, '') || "5571999999999"}?text=${text}`, '_blank');
              }}
            >
              <MessageSquare className="w-5 h-5" />
              Confirmar no WhatsApp
            </Button>
            <Button variant="ghost" className="w-full text-slate-500 hover:text-white transition-colors font-semibold" onClick={() => window.location.reload()}>
              Fazer novo agendamento
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="max-w-2xl mx-auto p-6 md:p-12 space-y-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 overflow-hidden border border-white/5">
              <PublicLogoImage url={settings?.logo_url} fallbackName={settings?.name} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter">{settings?.name || "RESTYLE"}</h1>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Premium Experience</p>
            </div>
          </div>
          {step > 1 && (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="text-slate-500 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          )}
        </header>

        {/* Progress Stepper */}
        <div className="flex justify-between items-center px-4 md:px-10 relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10" />
          {steps.map((s, i) => (
            <div key={s.id} className="relative z-10">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                step === s.id ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-110" : 
                step > s.id ? "bg-blue-600/20 text-blue-400" : "bg-slate-900 text-slate-600 border border-white/5"
              )}>
                {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
            </div>
          ))}
        </div>

        <main className="min-h-[500px] bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8 md:p-12 backdrop-blur-xl">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">Escolha o serviço</h2>
                <p className="text-slate-500 text-sm">Selecione o que deseja realizar hoje.</p>
              </div>
              <div className="grid gap-4">
                {activeServices.map((service) => (
                  <button
                    key={service.id}
                    className={cn(
                      "w-full flex items-center p-4 rounded-3xl transition-all duration-300 group border text-left overflow-hidden relative",
                      selectedServiceId === service.id 
                        ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-600/10" 
                        : "bg-black/40 border-white/5 hover:border-white/10 hover:bg-black/60"
                    )}
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      setTimeout(() => setStep(2), 300);
                    }}
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-800 border border-white/5 relative group">
                      <ImageWithFallback 
                        src={getPublicAssetUrl(service.image_url) || undefined} 
                        alt={service.name} 
                        className="w-full h-full object-cover"
                        fallback={<Scissors className="w-6 h-6 text-slate-600" />}
                      />
                      
                      {selectedServiceId === service.id && (
                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center backdrop-blur-[2px]">
                          <CheckCircle2 className="w-8 h-8 text-white shadow-2xl" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-5 flex-1 min-w-0 pr-4">
                      <div className="flex flex-col gap-0.5">
                        <h3 className={cn(
                          "font-bold text-lg tracking-tight truncate",
                          selectedServiceId === service.id ? "text-white" : "text-white"
                        )}>
                          {service.name}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-widest",
                            selectedServiceId === service.id ? "text-blue-100" : "text-slate-500"
                          )}>
                            {service.duration_minutes} min
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <span className={cn(
                          "text-xl font-bold tracking-tighter",
                          selectedServiceId === service.id ? "text-white" : "text-blue-500"
                        )}>
                          R$ {Number(service.price).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">Quem atende?</h2>
                <p className="text-slate-500 text-sm">Selecione o profissional de sua preferência.</p>
              </div>
              <div className="grid gap-4">
                {(professionals as any[]).filter(p => p.active).map((prof) => (
                  <button
                    key={prof.id}
                    className={cn(
                      "w-full flex items-center p-6 rounded-3xl transition-all duration-300 group border text-left",
                      selectedProfessionalId === prof.id 
                        ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-600/10" 
                        : "bg-black/40 border-white/5 hover:border-white/10 hover:bg-black/60"
                    )}
                    onClick={() => {
                      setSelectedProfessionalId(prof.id);
                      setTimeout(() => setStep(3), 300);
                    }}
                  >
                    <div className={cn(
                      "w-20 h-20 rounded-2xl mr-5 flex items-center justify-center font-bold text-2xl transition-colors overflow-hidden border border-white/10",
                      selectedProfessionalId === prof.id ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                    )}>
                      <ImageWithFallback 
                        src={getPublicAssetUrl(prof.avatar_url) || undefined} 
                        alt={prof.name} 
                        className="w-full h-full object-cover"
                        fallback={prof.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-lg tracking-tight">{prof.name}</p>
                      {prof.instagram ? (
                         <p className={cn("text-xs font-medium lowercase tracking-widest", selectedProfessionalId === prof.id ? "text-blue-100" : "text-slate-500")}>
                           @{prof.instagram.replace('@', '')}
                         </p>
                      ) : (
                        <p className={cn("text-xs font-medium uppercase tracking-widest", selectedProfessionalId === prof.id ? "text-blue-100" : "text-slate-500")}>
                          Especialista
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">Para quando?</h2>
                <p className="text-slate-500 text-sm">Selecione uma data disponível.</p>
              </div>
              <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) setTimeout(() => setStep(4), 300);
                  }}
                  locale={ptBR}
                  disabled={(date) => isBefore(date, startOfDay(new Date())) || isAfter(date, addDays(new Date(), 30))}
                  className="rounded-md mx-auto"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">Qual horário?</h2>
                <p className="text-slate-500 text-sm">Disponibilidade para {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
              {isLoadingSlots ? (
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      className={cn(
                        "h-14 rounded-2xl font-bold text-sm transition-all duration-300 border",
                        slot.available 
                          ? selectedTime === slot.time
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                            : "bg-black/40 border-white/5 text-slate-300 hover:border-blue-500/50 hover:bg-black/60"
                          : "opacity-10 grayscale border-transparent cursor-not-allowed"
                      )}
                      onClick={() => {
                        setSelectedTime(slot.time);
                        setTimeout(() => setStep(5), 300);
                      }}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 text-slate-700" />
                  </div>
                  <p className="text-slate-500 font-medium">Nenhum horário disponível hoje.</p>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">Finalizar</h2>
                <p className="text-slate-500 text-sm">Confirme seus dados para reservar.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Nome Completo</Label>
                  <Input 
                    id="name" 
                    placeholder="João Silva" 
                    className="bg-black/40 border-white/10 h-14 rounded-2xl px-5 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">WhatsApp</Label>
                  <Input 
                    id="phone" 
                    placeholder="(71) 99999-9999" 
                    className="bg-black/40 border-white/10 h-14 rounded-2xl px-5 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Observação (Opcional)</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Algum detalhe para o barbeiro?" 
                    className="bg-black/40 border-white/10 rounded-2xl p-5 min-h-[100px] focus:ring-blue-600 focus:border-blue-600 transition-all"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-[2rem] space-y-1">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Resumo da Reserva</p>
                <p className="text-lg font-bold tracking-tight">{selectedService?.name}</p>
                <p className="text-sm text-slate-400 font-medium">{selectedProfessional?.name} • {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}</p>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-blue-600/30 transition-all active:scale-[0.98]"
                onClick={handleBooking}
                disabled={isBooking || !customerName || !customerPhone}
              >
                {isBooking ? "Confirmando..." : "Confirmar Agendamento"}
              </Button>
            </div>
          )}
        </main>

        <footer className="pt-8 text-center space-y-4">
          <div className="flex justify-center items-center gap-6">
             <div className="w-1 h-1 bg-white/20 rounded-full" />
             <div className="w-1 h-1 bg-white/20 rounded-full" />
             <div className="w-1 h-1 bg-white/20 rounded-full" />
          </div>
          <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold">© RESTYLE PREMIUM BARBER</p>
        </footer>
      </div>
    </div>
  );
}

function PublicLogoImage({ url, fallbackName }: { url?: string | null | undefined, fallbackName?: string | null | undefined }) {
  return (
    <ImageWithFallback 
      src={getPublicAssetUrl(url) || undefined} 
      alt={fallbackName ? `Logo da ${fallbackName}` : "Logo da barbearia"} 
      className="w-full h-full object-cover" 
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold">
          {fallbackName ? fallbackName.charAt(0).toUpperCase() : <Scissors className="w-5 h-5" />}
        </div>
      }
    />
  );
}

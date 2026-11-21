import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Check, Scissors, Instagram, Phone, MapPin, Clock, ArrowRight, ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user } = useAuth();
  const { refresh: refreshBarbershop } = useCurrentBarbershop();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state: accessState, isLoading: accessLoading } = useAccessState();
  
  // TODOS os hooks devem ser declarados no topo, antes de qualquer return condicional
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shopName, setShopName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("America/Bahia");
  const [hours, setHours] = useState([
    { weekday: 0, name: "Domingo", open: false, open_time: "08:00", close_time: "18:00" },
    { weekday: 1, name: "Segunda", open: true, open_time: "08:00", close_time: "18:00" },
    { weekday: 2, name: "Terça", open: true, open_time: "08:00", close_time: "18:00" },
    { weekday: 3, name: "Quarta", open: true, open_time: "08:00", close_time: "18:00" },
    { weekday: 4, name: "Quinta", open: true, open_time: "08:00", close_time: "18:00" },
    { weekday: 5, name: "Sexta", open: true, open_time: "08:00", close_time: "18:00" },
    { weekday: 6, name: "Sábado", open: true, open_time: "08:00", close_time: "18:00" },
  ]);

  useEffect(() => {
    if (accessLoading) return;
    
    if (accessState === 'UNAUTHENTICATED') {
      navigate({ to: '/auth', replace: true });
    } else if (accessState === 'AUTHENTICATED_WITH_BARBERSHOP') {
      navigate({ to: '/' as any, replace: true });
    }
  }, [accessState, accessLoading, navigate]);

  // Early returns somente DEPOIS de todos os hooks
  if (accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoUrl(URL.createObjectURL(file));
    }
  };

  const nextStep = () => {
    if (step === 1 && !shopName.trim()) {
      toast.error("O nome da barbearia é obrigatório");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const finishOnboarding = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Prepare Slug
      const slug = shopName.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
      
      // 2. Upload Logo if exists
      let finalLogoUrl = "";
      let tempLogoPath = "";
      if (logoFile && user) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        // Path vinculado ao auth.uid() para bypassar RLS durante onboarding de forma segura
        tempLogoPath = `onboarding/${user.id}/logo/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('barbershop-logos')
          .upload(tempLogoPath, logoFile);
          
        if (uploadError) throw uploadError;
        finalLogoUrl = tempLogoPath; // Envia o path relativo para a RPC mover
      }

      // 3. Call Atomic Onboarding RPC
      const businessHoursJson = hours.map(h => ({
        weekday: h.weekday,
        open_time: h.open ? h.open_time : "00:00",
        close_time: h.open ? h.close_time : "00:00",
        active: h.open
      }));

      const { data, error } = await supabase.rpc('create_barbershop_onboarding', {
        p_name: shopName,
        p_slug: slug,
        p_logo_url: finalLogoUrl || '',
        p_user_id: user.id,
        p_instagram: instagram,
        p_whatsapp: whatsapp,
        p_city: city,
        p_state: state,
        p_address: address,
        p_timezone: timezone,
        p_business_hours: businessHoursJson as any
      });

      if (error) throw error;

      toast.success("Barbearia configurada com sucesso!");
      
      // 5. Invalidate all related queries to avoid stale cache
      await queryClient.invalidateQueries();
      
      // 6. Explicitly refresh the context and wait for it
      await refreshBarbershop();
      
      // 7. Navigate directly
      navigate({ to: "/" as any, replace: true });
    } catch (err: any) {
      console.error(err);
      // Limpeza de arquivo órfão se a RPC falhar
      if (logoFile && user) {
        try {
          const files = await supabase.storage.from('barbershop-logos').list(`onboarding/${user.id}/logo`);
          if (files.data && files.data.length > 0) {
            const paths = files.data.map(f => `onboarding/${user.id}/logo/${f.name}`);
            await supabase.storage.from('barbershop-logos').remove(paths);
          }
        } catch (cleanupErr) {
          console.error("Erro ao limpar logo órfã:", cleanupErr);
        }
      }
      toast.error(err.message || "Não foi possível criar sua barbearia. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 flex flex-col items-center py-12 px-6 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/20">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tighter">
              Olá, {(user?.user_metadata as any)?.name?.split(' ')[0] || 'seja bem-vindo'}
            </h1>
            <p className="text-slate-500 text-sm">Vamos preparar seu espaço no RESTYLE.</p>
          </div>
        </header>

        {/* Stepper */}
        <div className="flex justify-between items-center px-4 relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10" />
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-500 border",
              step === s ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20 scale-110" :
              step > s ? "bg-blue-600/20 border-blue-500/30 text-blue-400" : "bg-slate-900 border-white/5 text-slate-600"
            )}>
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>

        <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 flex-1">
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-blue-500" />
                  Identidade Básica
                </h2>
                <p className="text-slate-500 text-xs">Como sua barbearia será conhecida pelos clientes.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shopName" className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1">Nome da Barbearia *</Label>
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Ex: Barbearia Central"
                  className="h-14 rounded-2xl bg-black/40 border-white/5 focus:border-blue-500/50 text-white placeholder:text-slate-700 transition-all"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 flex-1">
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-500" />
                  Visual e Contato
                </h2>
                <p className="text-slate-500 text-xs">Opcionais que ajudam na divulgação do seu espaço.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-24 h-24 rounded-[2rem] bg-black/40 border border-dashed border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer" onClick={() => document.getElementById('logo-upload')?.click()}>
                    {logoUrl ? (
                      <>
                        <ImageWithFallback 
                          src={logoUrl} 
                          className="w-full h-full object-cover" 
                          fallback={<Upload className="w-6 h-6 text-slate-600" />}
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-slate-600 mx-auto" />
                        <span className="text-[10px] text-slate-600 uppercase font-bold mt-1 block">Logo</span>
                      </div>
                    )}
                  </div>
                  <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  {logoUrl && (
                    <button onClick={() => { setLogoFile(null); setLogoUrl(""); }} className="text-[10px] text-red-500 font-bold uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-1">
                      <X className="w-3 h-3" /> Remover Logo
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1 flex items-center gap-2">
                      <Instagram className="w-3 h-3" /> Instagram
                    </Label>
                    <Input
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@seu.perfil"
                      className="h-12 rounded-xl bg-black/40 border-white/5 focus:border-blue-500/50 text-white placeholder:text-slate-700 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1 flex items-center gap-2">
                      <Phone className="w-3 h-3" /> WhatsApp
                    </Label>
                    <Input
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="h-12 rounded-xl bg-black/40 border-white/5 focus:border-blue-500/50 text-white placeholder:text-slate-700 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 flex-1">
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Localização e Horário
                </h2>
                <p className="text-slate-500 text-xs">Onde você atende e qual seu fuso horário.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1">Cidade</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Sua cidade"
                      className="h-12 rounded-xl bg-black/40 border-white/5 focus:border-blue-500/50 text-white placeholder:text-slate-700 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1">Estado</Label>
                    <Input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="UF"
                      className="h-12 rounded-xl bg-black/40 border-white/5 focus:border-blue-500/50 text-white placeholder:text-slate-700 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1">Timezone</Label>
                  <select 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-12 rounded-xl bg-black/40 border border-white/5 focus:border-blue-500/50 text-white px-4 text-sm appearance-none outline-none"
                  >
                    <option value="America/Bahia">Bahia (America/Bahia)</option>
                    <option value="America/Sao_Paulo">São Paulo (America/Sao_Paulo)</option>
                    <option value="America/Cuiaba">Cuiabá (America/Cuiaba)</option>
                    <option value="America/Manaus">Manaus (America/Manaus)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 flex-1">
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Expediente Semanal
                </h2>
                <p className="text-slate-500 text-xs">Defina os dias e horários de funcionamento.</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {hours.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5">
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        aria-label={h.open ? `Fechar a barbearia na ${h.name}` : `Abrir a barbearia na ${h.name}`}
                        aria-pressed={h.open}
                        onClick={() => {
                          const newHours = [...hours];
                          const item = newHours[i];
                          if (item) {
                            item.open = !item.open;
                            setHours(newHours);
                          }
                        }}
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                          h.open ? "bg-blue-600 text-white" : "bg-slate-800 text-transparent"
                        )}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <span className={cn("text-xs font-bold uppercase tracking-wider", h.open ? "text-slate-200" : "text-slate-600")}>{h.name}</span>
                    </div>
                    {h.open && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="time" 
                          value={h.open_time} 
                          onChange={(e) => {
                            const newHours = [...hours];
                            const item = newHours[i];
                            if (item) {
                              item.open_time = e.target.value;
                              setHours(newHours);
                            }
                          }}
                          className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white outline-none" 
                        />
                        <span className="text-[10px] text-slate-600">às</span>
                        <input 
                          type="time" 
                          value={h.close_time} 
                          onChange={(e) => {
                            const newHours = [...hours];
                            const item = newHours[i];
                            if (item) {
                              item.close_time = e.target.value;
                              setHours(newHours);
                            }
                          }}
                          className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white outline-none" 
                        />
                      </div>
                    )}
                    {!h.open && <span className="text-[10px] font-bold text-red-500/50 uppercase tracking-widest">Fechado</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-white/10 text-white bg-slate-900/50 hover:bg-slate-900 flex-1 gap-2"
                onClick={prevStep}
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </Button>
            )}
            {step < 4 ? (
              <Button 
                className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1 gap-2 shadow-lg shadow-blue-600/20"
                onClick={nextStep}
              >
                Próximo <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1 gap-2 shadow-lg shadow-blue-600/20"
                onClick={finishOnboarding}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Concluir <Check className="w-4 h-4" /></>}
              </Button>
            )}
          </div>
        </Card>

        <p className="text-center text-[10px] text-slate-700 uppercase tracking-[0.2em] font-bold">
          RESTYLE Premium Management • 2026
        </p>
      </div>
    </div>
  );
}

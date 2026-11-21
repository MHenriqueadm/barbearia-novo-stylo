import { createFileRoute } from "@tanstack/react-router";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { supabase } from "@/integrations/supabase/client";
import { getPublicAssetUrl } from "@/lib/storage";
import { useBarbershopSettings, useBusinessHours, useBusinessBreaks } from "@/hooks/useBarbearia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: ConfigPage,
});

function ConfigPage() {
  const { currentBarbershop } = useCurrentBarbershop();
  const { 
    data: settings, 
    isLoading: loadingSettings, 
    updateSettings,
    uploadLogo,
    isUploadingLogo,
    removeLogo
  } = useBarbershopSettings();
  const { data: hours, isLoading: loadingHours, updateBusinessHour } = useBusinessHours();
  const { 
    data: breaks = [], 
    createBreakAsync, 
    updateBreakAsync, 
    deleteBreak,
    isCreating,
    isUpdating
  } = useBusinessBreaks();
  const [form, setForm] = useState<any>({});
  
  const [editingBreakId, setEditingBreakId] = useState<string | null>(null);
  const [newBreakDay, setNewBreakDay] = useState<number | null>(null);
  const [breakForm, setBreakForm] = useState({ start_time: "12:00", end_time: "13:00", label: "" });
  const [isLocalSaving, setIsLocalSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);


  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (loadingSettings || loadingHours) return <div className="p-8 text-white">Carregando...</div>;

  const normalizeSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "")    // Remove special chars
      .trim()
      .replace(/\s+/g, "-")           // Replace spaces with -
      .replace(/-+/g, "-");           // Remove duplicate hyphens
  };

  const handleSave = async (data?: any) => {
    setIsLocalSaving(true);
    try {
      const updates = { ...(data || form) };
      
      // Slug normalization and validation
      if (updates.slug) {
        updates.slug = normalizeSlug(updates.slug);
        
        // If slug changed, validate availability
        if (updates.slug !== settings?.slug) {
          const { data: existing, error: checkError } = await supabase
            .from('barbershops')
            .select('id')
            .eq('slug', updates.slug)
            .maybeSingle();
            
          if (checkError) throw checkError;

          if (existing && existing.id !== currentBarbershop?.id) {
            toast.error("Este endereço já está sendo utilizado por outra barbearia. Escolha outro.");
            setIsLocalSaving(false);
            return;
          }
        }
      }

      await updateSettings(updates);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setIsLocalSaving(false);
    }
  };

  const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  const handleAddBreak = (weekday: number) => {
    setNewBreakDay(weekday);
    setEditingBreakId(null);
    setBreakForm({ start_time: "12:00", end_time: "13:00", label: "" });
  };

  const handleSaveBreak = async (weekday: number) => {
    if (breakForm.end_time <= breakForm.start_time) {
      toast.error("O horário de término deve ser após o início.");
      return;
    }

    // Check overlap with business hours
    const dayHour = hours?.find(h => h.weekday === weekday);
    if (dayHour) {
      const openTime = (dayHour.open_time || "08:00").slice(0, 5);
      const closeTime = (dayHour.close_time || "18:00").slice(0, 5);
      if (breakForm.start_time < openTime || breakForm.end_time > closeTime) {
        toast.error("O intervalo deve estar dentro do horário de funcionamento.");
        return;
      }
    }

    // Check overlap with other breaks
    const dayBreaks = breaks.filter(b => b.weekday === weekday && b.id !== editingBreakId);
    const hasOverlap = dayBreaks.some(b => {
      const bStart = b.start_time.slice(0, 5);
      const bEnd = b.end_time.slice(0, 5);
      return (breakForm.start_time < bEnd && breakForm.end_time > bStart);
    });

    if (hasOverlap) {
      toast.error("Este intervalo sobrepõe um intervalo existente.");
      return;
    }

    setIsLocalSaving(true);
    try {
      if (editingBreakId) {
        await updateBreakAsync({ id: editingBreakId, brk: breakForm });
        toast.success("Intervalo fechado atualizado.");
        setEditingBreakId(null);
      } else {
        if (!currentBarbershop) throw new Error("Barbershop not identified");
        await createBreakAsync({ ...breakForm, weekday, active: true, barbershop_id: currentBarbershop.id });
        toast.success("Intervalo fechado adicionado.");
        setNewBreakDay(null);
      }
      setBreakForm({ start_time: "12:00", end_time: "13:00", label: "" });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar o intervalo.");
    } finally {
      setIsLocalSaving(false);
    }
  };


  const handleEditBreak = (brk: any) => {
    setEditingBreakId(brk.id);
    setNewBreakDay(null);
    setBreakForm({ 
      start_time: brk.start_time.slice(0, 5), 
      end_time: brk.end_time.slice(0, 5), 
      label: brk.label || "" 
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24 text-white">
      <h1 className="text-2xl font-bold mb-8 tracking-tighter">Configurações</h1>

      <section className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 mb-8">
        <h2 className="text-lg font-bold mb-6">Identidade da barbearia</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Logo da barbearia</label>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden">
                <LogoImage url={getPublicAssetUrl(settings?.logo_url)} fallbackName={settings?.name} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-transparent border-white/10 hover:bg-white/5 text-xs h-9"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? "Enviando..." : "Alterar logo"}
                  </Button>
                  {settings?.logo_url && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs h-9"
                      onClick={async () => {
                        if (confirm("Deseja remover a logo?")) {
                          await removeLogo(settings.logo_url!);
                          await handleSave({ logo_url: null });
                          toast.success("Logo removida com sucesso.");
                        }
                      }}
                    >
                      Remover
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">PNG, JPG ou WEBP. Máx 5MB.</p>
                <input 
                  type="file" 
                  id="logo-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Arquivo muito grande. Máximo 5MB.");
                      return;
                    }

                    try {
                      const url = await uploadLogo(file);
                      await handleSave({ logo_url: url });
                      toast.success("Logo atualizada com sucesso.");
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Nome da barbearia</label>
            <Input 
              className="bg-black border-white/10 h-11" 
              placeholder="Ex: Otávio Barber Studio"
              value={form.name || ""} 
              onChange={(e) => setForm({...form, name: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Slug da barbearia (URL)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">/</span>
              <Input 
                className="bg-black border-white/10 h-11 pl-6" 
                placeholder="ex: barbearia-premium"
                value={form.slug || ""} 
                onChange={(e) => setForm({...form, slug: e.target.value})} 
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Link de agendamento: {typeof window !== 'undefined' ? `${window.location.origin}/${form.slug || '...'}/agendar` : ''}
            </p>
          </div>
        </div>

        <Button onClick={() => handleSave()} className="mt-8 w-full md:w-auto bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-11 transition-all">
          Salvar identidade
        </Button>
      </section>

      <section className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 mb-8">
        <h2 className="text-lg font-bold mb-6">Informações de Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Instagram</label>
            <Input className="bg-black border-white/10" value={form.instagram || ""} onChange={(e) => setForm({...form, instagram: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">WhatsApp</label>
            <Input className="bg-black border-white/10" value={form.whatsapp || ""} onChange={(e) => setForm({...form, whatsapp: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Cidade</label>
            <Input className="bg-black border-white/10" value={form.city || ""} onChange={(e) => setForm({...form, city: e.target.value})} />
          </div>
        </div>

        <Button onClick={() => handleSave()} className="mt-8 w-full md:w-auto bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-11 transition-all">
          Salvar perfil
        </Button>
      </section>

      <section className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 mb-8">
        <h2 className="text-lg font-bold mb-6">Horários de funcionamento</h2>
        <div className="space-y-4">
          {hours?.map((h) => (
            <div key={h.id} className="space-y-3 p-4 border border-border rounded-xl bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="font-bold">{dayNames[h.weekday]}</span>
                <div className="flex items-center gap-4">
                  <Switch checked={h.active ?? false} onCheckedChange={(val) => updateBusinessHour({ id: h.id, hour: { active: val } })} />
                  {h.active && (
                    <div className="flex gap-2 items-center">
                      <Input type="time" className="w-24 bg-black border-white/10 h-9" value={(h.open_time || "08:00").slice(0, 5)} onChange={(e) => updateBusinessHour({ id: h.id, hour: { open_time: e.target.value } })} />
                      <span className="text-slate-500">—</span>
                      <Input type="time" className="w-24 bg-black border-white/10 h-9" value={(h.close_time || "18:00").slice(0, 5)} onChange={(e) => updateBusinessHour({ id: h.id, hour: { close_time: e.target.value } })} />
                    </div>
                  )}
                </div>
              </div>

              {h.active && (
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Intervalos fechados (Barbearia)</p>
                  
                  <div className="space-y-2">
                    {breaks.filter(b => b.weekday === h.weekday).map(brk => (
                      <div key={brk.id} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5 group">
                        {editingBreakId === brk.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <Input type="time" className="w-24 h-8 text-xs bg-black border-white/10" value={breakForm.start_time} onChange={e => setBreakForm({...breakForm, start_time: e.target.value})} />
                            <Input type="time" className="w-24 h-8 text-xs bg-black border-white/10" value={breakForm.end_time} onChange={e => setBreakForm({...breakForm, end_time: e.target.value})} />
                            <Input placeholder="Descrição" className="flex-1 h-8 text-xs bg-black border-white/10" value={breakForm.label} onChange={e => setBreakForm({...breakForm, label: e.target.value})} />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => handleSaveBreak(h.weekday)} disabled={isLocalSaving}><Check className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" onClick={() => setEditingBreakId(null)} disabled={isLocalSaving}><X className="w-4 h-4" /></Button>

                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono text-blue-400">{brk.start_time.slice(0, 5)} — {brk.end_time.slice(0, 5)}</span>
                              {brk.label && <span className="text-xs text-slate-400 font-medium bg-white/5 px-2 py-0.5 rounded-full">{brk.label}</span>}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditBreak(brk)}><Edit2 className="w-3.5 h-3.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => deleteBreak(brk.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {newBreakDay === h.weekday ? (
                      <div className="flex items-center gap-2 bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
                        <Input type="time" className="w-24 h-8 text-xs bg-black border-white/10" value={breakForm.start_time} onChange={e => setBreakForm({...breakForm, start_time: e.target.value})} />
                        <Input type="time" className="w-24 h-8 text-xs bg-black border-white/10" value={breakForm.end_time} onChange={e => setBreakForm({...breakForm, end_time: e.target.value})} />
                        <Input placeholder="Descrição (ex: Almoço)" className="flex-1 h-8 text-xs bg-black border-white/10" value={breakForm.label} onChange={e => setBreakForm({...breakForm, label: e.target.value})} />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => handleSaveBreak(h.weekday)} disabled={isLocalSaving}><Check className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" onClick={() => setNewBreakDay(null)} disabled={isLocalSaving}><X className="w-4 h-4" /></Button>

                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-blue-500 hover:text-blue-400 hover:bg-blue-500/5 border border-dashed border-blue-500/20 rounded-lg h-9" onClick={() => handleAddBreak(h.weekday)}>
                        <Plus className="w-3 h-3 mr-2" />
                        Adicionar intervalo fechado
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      
      <PWAConfigSection />
    </div>
  );
}

function PWAConfigSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <section className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
          <span className="font-bold text-white text-xl">R</span>
        </div>
        <div>
          <h2 className="text-lg font-bold">Aplicativo RESTYLE</h2>
          <p className="text-xs text-slate-400">Instale para acessar mais rápido pelo celular</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Status</p>
            <div className="text-sm font-semibold flex items-center gap-2">
              {isStandalone ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Instalado</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Não instalado</span>
                </>
              )}
            </div>
          </div>
          
          {!isStandalone && (
            <>
              {deferredPrompt ? (
                <Button 
                  onClick={handleInstall}
                  className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl px-6"
                >
                  Instalar agora
                </Button>
              ) : isIOS ? (
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 max-w-[150px] leading-tight">
                    Toque em <span className="text-white">Compartilhar</span> e <span className="text-white">Adicionar à Tela de Início</span>
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        {!isStandalone && (
          <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10">
            <p className="text-xs text-slate-400 leading-relaxed">
              O aplicativo oferece uma experiência em tela cheia, melhor desempenho e acesso direto pela sua lista de apps, sem as barras do navegador.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function LogoImage({ url, fallbackName }: { url?: string | null | undefined, fallbackName?: string | null | undefined }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [url]);

  if (url && !error) {
    return (
      <img 
        src={url} 
        key={url}
        alt="Logo" 
        className="w-full h-full object-cover" 
        onError={() => {
          console.error("LogoImage error for URL:", url);
          setError(true);
        }} 
      />
    );
  }

  return (
    <span className="text-2xl font-bold text-slate-700">
      {fallbackName ? fallbackName.charAt(0).toUpperCase() : "R"}
    </span>
  );
}

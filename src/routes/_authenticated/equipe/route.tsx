import { createFileRoute } from "@tanstack/react-router";
import { getPublicAssetUrl } from "@/lib/storage";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { useProfessionals, useProfessionalServices, useProfessionalSchedule, useProfessionalBreaks, useProfessionalBlocks } from "@/hooks/useProfessionals";
import { useServices, useBusinessHours } from "@/hooks/useBarbearia";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  User, 
  Instagram, 
  Settings2, 
  Scissors, 
  Clock, 
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Coffee,
  ShieldAlert,
  Upload,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/equipe")({
  component: EquipePage,
});

function EquipePage() {
  const { currentBarbershop } = useCurrentBarbershop();
  const { 
    professionals, 
    isLoading: loadingProfessionals, 
    createProfessional, 
    updateProfessional,
    uploadAvatar
  } = useProfessionals();
  const { data: allServices } = useServices();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isBreaksBlocksModalOpen, setIsBreaksBlocksModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    instagram: "",
    phone: "",
    whatsapp: "",
    bio: "",
    active: true,
    avatar_url: null as string | null
  });

  const handleSaveProfessional = () => {
    if (!currentBarbershop) {
      toast.error("Barbearia não identificada.");
      return;
    }

    if (selectedProfessional?.id) {
      updateProfessional({ id: selectedProfessional.id, professional: formData });
    } else {
      createProfessional({ 
        ...formData, 
        sort_order: (professionals?.length || 0) + 1,
        barbershop_id: currentBarbershop.id 
      });
    }
    setIsModalOpen(false);
    setSelectedProfessional(null);
  };

  const openEdit = (p: any) => {
    setSelectedProfessional(p);
    setFormData({
      name: p.name,
      instagram: p.instagram || "",
      phone: p.phone || "",
      whatsapp: p.whatsapp || "",
      bio: p.bio || "",
      active: p.active,
      avatar_url: p.avatar_url || null
    });
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProfessional?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou WEBP.");
      return;
    }

    try {
      setIsUploading(true);
      if (formData.avatar_url) {
        // Just clear from form, removing from storage is optional/complex to manage here
      }
      const newUrl = await uploadAvatar({ id: selectedProfessional.id, file });
      setFormData(prev => ({ ...prev, avatar_url: newUrl }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!selectedProfessional?.id || !formData.avatar_url) return;
    try {
      setIsUploading(true);
      // Just clear from form
      setFormData(prev => ({ ...prev, avatar_url: null }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (loadingProfessionals) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os profissionais e seus horários de atendimento.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { 
              setSelectedProfessional(null); 
              setFormData({ name: "", instagram: "", phone: "", whatsapp: "", bio: "", active: true, avatar_url: null }); 
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo profissional
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedProfessional ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedProfessional && (
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Foto do profissional</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30 relative group">
                      {isUploading ? (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-[10px] text-white font-bold p-2 text-center">
                          <Clock className="w-4 h-4 mb-1 animate-spin" />
                          Enviando...
                        </div>
                      ) : (
                        <>
                          <ImageWithFallback 
                            src={formData.avatar_url ? getPublicAssetUrl(formData.avatar_url)! : undefined} 
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                            fallback={<User className="w-10 h-10 text-muted-foreground" />}
                          />
                          <button 
                            onClick={handleRemoveAvatar}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-20"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" className="relative cursor-pointer" disabled={isUploading}>
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isUploading}
                        />
                        <Upload className="w-4 h-4 mr-2" />
                        {formData.avatar_url ? "Trocar foto" : "Escolher foto"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground">PNG, JPG ou WEBP. Máx 5MB.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Nome completo</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instagram</label>
                  <Input value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} placeholder="@exemplo" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">WhatsApp</label>
                  <Input value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} placeholder="77 9..." />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="h-20" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Ativo</label>
                <Switch checked={formData.active} onCheckedChange={(val) => setFormData({...formData, active: val})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveProfessional} className="w-full">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals?.map((p: any) => (
          <ProfessionalCard 
            key={p.id} 
            professional={p} 
            onEdit={() => openEdit(p)}
            onManageServices={() => { setSelectedProfessional(p); setIsServicesModalOpen(true); }}
            onManageSchedule={() => { setSelectedProfessional(p); setIsScheduleModalOpen(true); }}
            onManageBreaks={() => { setSelectedProfessional(p); setIsBreaksBlocksModalOpen(true); }}
            onToggleStatus={() => updateProfessional({ id: p.id, professional: { active: !p.active } })}

          />
        ))}
      </div>

      {selectedProfessional && (
        <>
          <ServicesModal 
            isOpen={isServicesModalOpen} 
            onOpenChange={setIsServicesModalOpen} 
            professional={selectedProfessional}
            allServices={allServices || []}
          />
          <ScheduleModal 
            isOpen={isScheduleModalOpen} 
            onOpenChange={setIsScheduleModalOpen} 
            professional={selectedProfessional}
          />
          <BlocksModal
            isOpen={isBreaksBlocksModalOpen}
            onOpenChange={setIsBreaksBlocksModalOpen}
            professional={selectedProfessional}
          />
        </>
      )}
    </div>
  );
}


function ProfessionalCard({ professional, onEdit, onManageServices, onManageSchedule, onToggleStatus }: any) {
  return (
    <Card className="p-6 border-border bg-card relative overflow-hidden">
      <div className="flex items-start justify-between mb-6">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-white/10 overflow-hidden ring-2 ring-blue-500/20 shadow-xl">
            <ImageWithFallback 
              src={professional.avatar_url ? getPublicAssetUrl(professional.avatar_url)! : undefined} 
              alt={professional.name} 
              className="w-full h-full object-cover" 
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 font-bold text-xl uppercase">
                  {professional.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
              }
            />
          </div>
          <div>
            <h3 className="font-bold text-lg">{professional.name}</h3>
            {professional.instagram && (
              <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                <Instagram className="w-3 h-3 mr-1" />
                {professional.instagram}
              </div>
            )}
            <Badge className="mt-2" variant={professional.active ? "default" : "secondary"}>
              {professional.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="w-4 h-4 mr-2" /> Editar Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageServices}>
              <Scissors className="w-4 h-4 mr-2" /> Serviços
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageSchedule}>
              <Clock className="w-4 h-4 mr-2" /> Horários
            </DropdownMenuItem>
            <DropdownMenuItem className={professional.active ? "text-destructive" : "text-primary"} onClick={onToggleStatus}>
              {professional.active ? "Desativar" : "Ativar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="w-full text-xs h-9" onClick={onManageServices}>
          <Scissors className="w-3.5 h-3.5 mr-2" /> Serviços
        </Button>
        <Button variant="outline" className="w-full text-xs h-9" onClick={onManageSchedule}>
          <Calendar className="w-3.5 h-3.5 mr-2" /> Horários
        </Button>
      </div>
    </Card>
  );
}

function ServicesModal({ isOpen, onOpenChange, professional, allServices }: any) {
  const { data: linkedServices, setProfessionalServices } = useProfessionalServices(professional.id);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Update local state when query data arrives
  const [hasInitialized, setHasInitialized] = useState(false);
  if (linkedServices && !hasInitialized) {
    setSelectedIds(linkedServices.map(s => s.service_id));
    setHasInitialized(true);
  }

  const handleToggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => setSelectedIds(allServices.map((s: any) => s.id));
  const handleRemoveAll = () => setSelectedIds([]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Serviços de {professional.name}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-between mt-2 mb-4">
          <Button variant="link" size="sm" onClick={handleSelectAll} className="h-auto p-0">Selecionar todos</Button>
          <Button variant="link" size="sm" onClick={handleRemoveAll} className="h-auto p-0 text-muted-foreground">Remover todos</Button>
        </div>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          {allServices.filter((s: any) => s.active).map((service: any) => (
            <div key={service.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <Checkbox 
                id={service.id} 
                checked={selectedIds.includes(service.id)}
                onCheckedChange={() => handleToggle(service.id)}
              />
              <label htmlFor={service.id} className="text-sm font-medium flex-1 cursor-pointer">
                {service.name}
              </label>
              <span className="text-xs text-muted-foreground">R$ {Number(service.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <DialogFooter className="mt-6">
          <Button onClick={() => { setProfessionalServices(selectedIds); onOpenChange(false); }} className="w-full">
            Salvar Vínculos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleModal({ isOpen, onOpenChange, professional }: any) {
  const { currentBarbershop } = useCurrentBarbershop();
  const { data: specificSchedules, updateSchedule } = useProfessionalSchedule(professional.id);
  const { breaks, createBreak, updateBreak, deleteBreak } = useProfessionalBreaks(professional.id);
  const { data: mainHours } = useBusinessHours();
  const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const handleToggle = (weekday: number, currentSpecific: any, mainDay: any) => {
    if (currentSpecific) {
      updateSchedule({ weekday, schedule: { active: !currentSpecific.active } });
    } else {
      updateSchedule({ weekday, schedule: { active: !mainDay.active, start_time: mainDay.open_time, end_time: mainDay.close_time } });
    }
  };

  const handleTimeChange = (weekday: number, currentSpecific: any, mainDay: any, field: 'start_time' | 'end_time', value: string) => {
    const start = field === 'start_time' ? value : (currentSpecific?.start_time || mainDay.open_time);
    const end = field === 'end_time' ? value : (currentSpecific?.end_time || mainDay.close_time);

    if (end <= start) {
      toast.error("O horário de término deve ser após o início.");
      return;
    }

    if (start < mainDay.open_time || end > mainDay.close_time) {
      toast.error(`O horário deve estar entre ${mainDay.open_time.slice(0, 5)} e ${mainDay.close_time.slice(0, 5)}.`);
      return;
    }

    updateSchedule({ 
      weekday, 
      schedule: { 
        [field]: value,
        start_time: start,
        end_time: end,
        active: currentSpecific?.active ?? mainDay.active
      } 
    });
  };

  const handleAddBreak = (weekday: number) => {
    if (!currentBarbershop) return;
    createBreak({
      professional_id: professional.id,
      barbershop_id: currentBarbershop.id,
      weekday,
      start_time: "12:00",
      end_time: "13:00",
      active: true,
      label: "Pausa"
    });
  };

  const handleUpdateBreak = (id: string, field: 'start_time' | 'end_time', value: string, currentBreak: any) => {
    const start = field === 'start_time' ? value : currentBreak.start_time;
    const end = field === 'end_time' ? value : currentBreak.end_time;

    if (end <= start) {
      toast.error("O horário de término deve ser após o início.");
      return;
    }

    updateBreak({ id, brk: { [field]: value } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Horários: {professional.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {mainHours?.sort((a, b) => (a.weekday === 0 ? 7 : a.weekday) - (b.weekday === 0 ? 7 : b.weekday)).map((h) => {
            const specific = specificSchedules?.find((s: any) => s.weekday === h.weekday);
            const isActive = specific ? (specific as any).active : h.active;
            const openTime = specific ? specific.start_time : (h.open_time || "08:00");
            const closeTime = specific ? specific.end_time : (h.close_time || "18:00");
            const dayBreaks = breaks?.filter(b => b.weekday === h.weekday) || [];
            const isExpanded = expandedDay === h.weekday;

            return (
              <div key={h.weekday} className="p-4 border border-border rounded-xl space-y-3 transition-all duration-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedDay(isExpanded ? null : h.weekday)}>
                  <div className="flex flex-col">
                    <span className="font-bold">{dayNames[h.weekday]}</span>
                    {!specific ? (
                      <span className="text-[9px] text-primary uppercase font-bold tracking-wider">Herda Barbearia</span>
                    ) : (
                      <span className="text-[9px] text-blue-500 uppercase font-bold tracking-wider">Customizado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch 
                      checked={isActive ?? false} 
                      onCheckedChange={(val) => {
                        handleToggle(h.weekday, specific, h);
                        if (val) setExpandedDay(h.weekday);
                      }}
                      onClick={(e) => e.stopPropagation()} 
                    />
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && isActive && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Expediente</label>
                      <div className="flex gap-2 items-center">
                        <Input 
                          type="time" 
                          className="h-9" 
                          value={openTime.slice(0, 5)} 
                          onChange={(e) => handleTimeChange(h.weekday, specific, h, 'start_time', e.target.value)}
                        />
                        <span className="text-muted-foreground">—</span>
                        <Input 
                          type="time" 
                          className="h-9" 
                          value={closeTime.slice(0, 5)} 
                          onChange={(e) => handleTimeChange(h.weekday, specific, h, 'end_time', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Pausas</label>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => handleAddBreak(h.weekday)}>
                          <Plus className="w-3 h-3 mr-1" /> Adicionar pausa
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {dayBreaks.map((b) => (
                          <div key={b.id} className="flex gap-2 items-center group">
                            <Input 
                              type="time" 
                              className="h-8 text-xs" 
                              value={b.start_time.slice(0, 5)} 
                              onChange={(e) => handleUpdateBreak(b.id, 'start_time', e.target.value, b)}
                            />
                            <span className="text-muted-foreground text-xs">—</span>
                            <Input 
                              type="time" 
                              className="h-8 text-xs" 
                              value={b.end_time.slice(0, 5)} 
                              onChange={(e) => handleUpdateBreak(b.id, 'end_time', e.target.value, b)}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteBreak(b.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                        {dayBreaks.length === 0 && (
                          <p className="text-[10px] text-muted-foreground italic">Sem pausas configuradas.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BlocksModal({ isOpen, onOpenChange, professional }: any) {
  const { currentBarbershop } = useCurrentBarbershop();
  const { data: blocks, createBlock, deleteBlock } = useProfessionalBlocks(professional.id);
  const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  
  const [newBlock, setNewBlock] = useState({ date: format(new Date(), "yyyy-MM-dd"), start_time: "09:00", end_time: "18:00", reason: "", all_day: false });

  const handleAddBlock = () => {
    const start = newBlock.all_day ? `${newBlock.date}T00:00:00` : `${newBlock.date}T${newBlock.start_time}:00`;
    const end = newBlock.all_day ? `${newBlock.date}T23:59:59` : `${newBlock.date}T${newBlock.end_time}:00`;
    
    if (!currentBarbershop) {
      toast.error("Barbearia não identificada.");
      return;
    }

    createBlock({
      professional_id: professional.id,
      start_at: new Date(start).toISOString(),
      end_at: new Date(end).toISOString(),
      reason: newBlock.reason,
      all_day: newBlock.all_day,
      barbershop_id: currentBarbershop.id
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bloqueios Pontuais: {professional.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-4">
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" /> Novo Bloqueio
            </h3>
            <div className="space-y-3 bg-muted/30 p-3 rounded-xl">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Data</label>
                  <Input type="date" className="h-9" value={newBlock.date} onChange={e => setNewBlock({...newBlock, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Motivo</label>
                  <Input className="h-9" placeholder="Ex: Médico" value={newBlock.reason} onChange={e => setNewBlock({...newBlock, reason: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="all-day-block" checked={newBlock.all_day} onCheckedChange={(val) => setNewBlock({...newBlock, all_day: !!val})} />
                  <label htmlFor="all-day-block" className="text-sm cursor-pointer">Dia Inteiro</label>
                </div>
                {!newBlock.all_day && (
                  <div className="flex gap-2 items-center">
                    <Input type="time" className="w-24 h-9" value={newBlock.start_time} onChange={e => setNewBlock({...newBlock, start_time: e.target.value})} />
                    <span>—</span>
                    <Input type="time" className="w-24 h-9" value={newBlock.end_time} onChange={e => setNewBlock({...newBlock, end_time: e.target.value})} />
                  </div>
                )}
                <Button onClick={handleAddBlock} className="h-9 px-6">Bloquear</Button>
              </div>
            </div>

            <div className="space-y-2">
              {blocks?.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-3 border border-border rounded-lg text-sm">
                  <div>
                    <span className="font-bold">{format(new Date(b.start_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    <p className="text-xs text-muted-foreground">{b.reason || "Sem motivo"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-xs">
                      {b.all_day ? "DIA TODO" : `${format(new Date(b.start_at), "HH:mm")} - ${format(new Date(b.end_at), "HH:mm")}`}
                    </span>

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBlock(b.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}



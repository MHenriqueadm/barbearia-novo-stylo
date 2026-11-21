import { createFileRoute } from '@tanstack/react-router'
import { getPublicAssetUrl } from "@/lib/storage";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { useServices } from "@/hooks/useBarbearia";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Scissors, Clock, DollarSign, Trash2, Edit2, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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

export const Route = createFileRoute("/_authenticated/servicos")({
  component: ServicosPage,
});

function ServicosPage() {
  const { 
    data: services, 
    isLoading, 
    createService, 
    updateService, 
    deleteService,
    uploadImage,
    isUploadingImage,
    removeImage
  } = useServices();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    duration_minutes: 30,
    active: true,
    image_url: "" as string | null
  });

  const { currentBarbershop } = useCurrentBarbershop();

  const handleSave = () => {
    if (!currentBarbershop) {
      toast.error("Barbearia não identificada.");
      return;
    }

    if (editingService) {
      updateService({ id: editingService.id, service: formData });
    } else {
      createService({ 
        ...formData, 
        sort_order: (services?.length || 0) + 1,
        barbershop_id: currentBarbershop.id 
      });
    }

    setIsModalOpen(false);
    setEditingService(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      name: "", 
      description: "", 
      price: 0, 
      duration_minutes: 30, 
      active: true,
      image_url: null
    });
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: Number(service.price),
      duration_minutes: service.duration_minutes,
      active: service.active,
      image_url: service.image_url || null
    });
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    // Validate type
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      alert("Apenas imagens PNG, JPG ou WEBP são aceitas.");
      return;
    }

    try {
      // For service photos, we must have the barbershop_id from the context.
      // If editing a service, we use its ID. If creating a new one, we could use a temp ID 
      // but the actual storage path will be barbershops/{barbershopId}/services/...
      const serviceId = editingService?.id || "new";
      const url = await uploadImage({ serviceId, file });
      setFormData((prev: any) => ({ ...prev, image_url: url }));
      
      // If it's an existing service, update it immediately to reflect in DB
      if (editingService?.id) {
        await updateService({ id: editingService.id, service: { image_url: url } });
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRemoveImage = async () => {
    if (formData.image_url) {
      // Optionally remove from storage if it's already saved
      // For now just clear from UI/form
      setFormData(prev => ({ ...prev, image_url: null }));
    }
  };

  if (isLoading) return <div className="p-8">Carregando serviços...</div>;

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos pela barbearia.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingService(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingService ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Foto do serviço</label>
                <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-white/10 rounded-2xl bg-black/20">
                  {formData.image_url ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                      <ImageWithFallback 
                        src={getPublicAssetUrl(formData.image_url)!} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="flex flex-col items-center gap-2">
                            <Scissors className="w-8 h-8 text-slate-700" />
                            <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">Erro ao carregar</span>
                          </div>
                        }
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="rounded-full h-9 px-4"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                        >
                          Trocar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="rounded-full h-9 px-4"
                          onClick={handleRemoveImage}
                          disabled={isUploadingImage}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="w-full aspect-video rounded-xl bg-slate-900 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors border border-white/5"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <span className="text-xs text-slate-400 font-medium">Enviando imagem...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
                            <Upload className="w-6 h-6 text-slate-400" />
                          </div>
                          <span className="text-sm font-medium text-slate-300">Escolher imagem</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">PNG, JPG, WEBP • Máx 5MB</span>
                        </>
                      )}
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/webp"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do serviço</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço (R$)</label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duração (min)</label>
                  <Input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Ativo</label>
                <Switch checked={formData.active} onCheckedChange={(val) => setFormData({...formData, active: val})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!services || services.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center rounded-xl">
          <Scissors className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">Nenhum serviço cadastrado</h2>
          <p className="text-muted-foreground mb-6">Cadastre o primeiro serviço da barbearia.</p>
          <Button onClick={() => { setEditingService(null); resetForm(); setIsModalOpen(true); }}>Cadastrar serviço</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className="border-border bg-card relative group overflow-hidden flex flex-col">
              <div className="aspect-[16/9] w-full relative bg-slate-900 border-b border-white/5 shrink-0 overflow-hidden">
                <ImageWithFallback 
                  src={service.image_url ? getPublicAssetUrl(service.image_url)! : undefined} 
                  alt={service.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 to-black">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                        <Scissors className="w-7 h-7 text-slate-500" />
                      </div>
                      <span className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">
                        {service.image_url ? "Erro na imagem" : "Sem imagem"}
                      </span>
                    </div>
                  }
                />
                
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge variant={service.active ? "default" : "secondary"} className="shadow-lg backdrop-blur-md">
                    {service.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                    {service.name}
                  </h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(service)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { if(confirm("Excluir serviço? Esta ação não poderá ser desfeita.")) deleteService(service.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-slate-400 line-clamp-2 min-h-[2.5rem] mb-6 leading-relaxed">
                  {service.description || "Nenhuma descrição informada para este serviço."}
                </p>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center text-slate-300 font-semibold">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    {service.duration_minutes} min
                  </div>
                  <div className="text-lg font-bold tracking-tighter text-white">
                    R$ {Number(service.price).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

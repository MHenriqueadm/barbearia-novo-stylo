import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Calendar, 
  MoreVertical, 
  CheckCircle2, 
  MessageSquare,
  ChevronRight,
  Filter,
  Trash2,
  AlertCircle,
  Scissors,
  History
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCustomers, useCustomerDetails } from "@/hooks/useCustomers";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { appointmentStatusMap } from "@/services/appointments";
import { formatPhone, normalizePhone } from "@/utils/phone";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

function ClientesPage() {
  const { currentBarbershop } = useCurrentBarbershop();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: customers = [], isLoading, createCustomer, updateCustomer, deactivateCustomer } = useCustomers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.phone_normalized.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleOpenModal = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
    } else {
      setEditingCustomer(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string || null,
      birth_date: formData.get("birth_date") as string || null,
      notes: formData.get("notes") as string || null,
      phone_normalized: "", // Will be re-calculated by service
      barbershop_id: currentBarbershop!.id,
    };

    try {
      if (editingCustomer) {
        await updateCustomer({ id: editingCustomer.id, customer: data });
      } else {
        if (!currentBarbershop) {
          toast.error("Barbearia não identificada.");
          return;
        }
        await createCustomer({ ...data, barbershop_id: currentBarbershop.id });
      }
      setIsModalOpen(false);
    } catch (e) {
      // toast handled in hook
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus clientes e acompanhe o histórico de atendimentos.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full md:w-auto shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Novo cliente
        </Button>
      </header>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou telefone..." 
            className="pl-9 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(customer => (
              <CustomerCard 
                key={customer.id} 
                customer={customer} 
                onClick={() => setSelectedCustomerId(customer.id)}
                onEdit={() => handleOpenModal(customer)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border border-dashed rounded-xl bg-card/30">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Nenhum cliente encontrado</p>
              <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                {searchTerm ? "Não encontramos resultados para sua busca." : "Os clientes aparecerão aqui após o primeiro agendamento ou cadastro manual."}
              </p>
            </div>
            {!searchTerm && (
              <Button variant="outline" size="sm" onClick={() => handleOpenModal()}>
                Cadastrar cliente
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" name="name" defaultValue={editingCustomer?.name} required placeholder="Ex: João Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp / Telefone</Label>
              <Input id="phone" name="phone" defaultValue={editingCustomer?.phone} required placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail (opcional)</Label>
              <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email} placeholder="joao@exemplo.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Nascimento (opcional)</Label>
                <Input id="birth_date" name="birth_date" type="date" defaultValue={editingCustomer?.birth_date} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Input id="notes" name="notes" defaultValue={editingCustomer?.notes} placeholder="Preferências, alergias, etc." />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar cliente</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CustomerDetailsSheet 
        customerId={selectedCustomerId} 
        onClose={() => setSelectedCustomerId(null)} 
        onEdit={(customer) => {
          setSelectedCustomerId(null);
          handleOpenModal(customer);
        }}
        onDeactivate={async (id) => {
          await deactivateCustomer(id);
          setSelectedCustomerId(null);
        }}
      />
    </div>
  );
}

function CustomerCard({ customer, onClick, onEdit }: { customer: any, onClick: () => void, onEdit: () => void }) {
  const { stats, isLoading } = useCustomerDetails(customer.id);

  return (
    <div 
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 space-y-4 hover:border-primary/40 transition-all group cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform duration-300">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground truncate max-w-[150px]">{customer.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" /> {formatPhone(customer.phone)}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Última visita</p>
          <p className="text-xs font-semibold">
            {isLoading ? "..." : stats?.lastVisit ? format(parseISO(stats.lastVisit), "dd/MM/yy") : "-"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Próximo</p>
          <p className="text-xs font-semibold text-primary">
            {isLoading ? "..." : stats?.nextAppointment ? format(parseISO(stats.nextAppointment), "dd/MM/yy") : "-"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <span className="text-[10px] text-muted-foreground">
          {isLoading ? "..." : `${stats?.totalAppointments || 0} atendimentos`}
        </span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <MoreVertical className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailsSheet({ customerId, onClose, onEdit, onDeactivate }: { customerId: string | null, onClose: () => void, onEdit: (c: any) => void, onDeactivate: (id: string) => void }) {
  const { customer, appointments, stats, isLoading } = useCustomerDetails(customerId || "");
  const navigate = useNavigate();

  if (!customerId) return null;

  const handleWhatsApp = () => {
    if (!customer?.phone) return;
    const normalized = normalizePhone(customer.phone);
    window.open(`https://wa.me/${normalized}`, "_blank");
  };

  const handleNewBooking = () => {
    onClose();
    navigate({ to: "/agenda", search: { openBooking: true, customerId: customer?.id } as any });
  };

  return (
    <Dialog open={!!customerId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : customer ? (
          <div className="flex flex-col">
            {/* Header Profile */}
            <div className="p-6 bg-accent/30 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center font-bold text-2xl text-primary-foreground shadow-lg shadow-primary/20">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{customer.name}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {formatPhone(customer.phone)}</span>
                    {customer.email && <span className="flex items-center gap-1 font-medium underline underline-offset-4">{customer.email}</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={handleWhatsApp} variant="outline" size="sm" className="h-9 px-4 border-green-500/30 text-green-500 hover:bg-green-500/10">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 border border-border">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(customer)}>
                      Editar informações
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeactivate(customer.id)} className="text-red-500">
                      Desativar cliente
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border divide-x divide-border bg-card">
              <div className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Visitas</p>
                <p className="text-lg font-bold">{stats?.totalAppointments || 0}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Última</p>
                <p className="text-sm font-semibold">{stats?.lastVisit ? format(parseISO(stats.lastVisit), "dd/MM/yyyy") : "-"}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Próxima</p>
                <p className="text-sm font-semibold text-primary">{stats?.nextAppointment ? format(parseISO(stats.nextAppointment), "dd/MM/yyyy") : "-"}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Gasto</p>
                <p className="text-lg font-bold">R$ {stats?.totalSpent?.toFixed(2).replace('.', ',') || "0,00"}</p>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="p-6 space-y-6 bg-background">
              {customer.notes && (
                <div className="bg-accent/20 p-4 rounded-xl border border-border/50">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Observações
                  </h4>
                  <p className="text-sm italic text-muted-foreground">"{customer.notes}"</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Histórico de Atendimentos
                </h3>
                <Button size="sm" className="h-8 px-3" onClick={handleNewBooking}>
                  <Plus className="w-3 h-3 mr-1" /> Novo agendamento
                </Button>
              </div>

              <div className="space-y-3">
                {appointments.length > 0 ? (
                  appointments.map((app: any) => (
                    <div key={app.id} className="p-3 border border-border rounded-xl bg-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-accent p-2 rounded-lg text-xs font-bold w-12 text-center shrink-0">
                          {format(parseISO(app.start_at), "HH:mm")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{app.service_name_snapshot}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1 uppercase font-medium">
                              {format(parseISO(app.start_at), "dd/MM/yyyy")}
                            </span>
                            <span className="flex items-center gap-1 italic">
                              por {app.professionals?.name || "Barbeiro"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                        <div className="text-right">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">Status</p>
                          <span className={cn(
                            "text-[10px] font-bold uppercase",
                            app.status === 'completed' ? "text-blue-500" :
                            app.status === 'cancelled' ? "text-red-500" :
                            app.status === 'no_show' ? "text-gray-500" : "text-yellow-500"
                          )}>
                            {appointmentStatusMap[app.status as keyof typeof appointmentStatusMap]}
                          </span>
                        </div>
                        <div className="text-right min-w-[60px]">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">Valor</p>
                          <p className="text-sm font-bold">R$ {Number(app.service_price_snapshot || 0).toFixed(2).replace('.', ',')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                    Nenhum atendimento realizado.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

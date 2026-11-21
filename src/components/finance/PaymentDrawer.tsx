import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  PaymentMethod, 
  PaymentStatus 
} from "@/services/finance";
import { useFinance } from "@/hooks/useFinance";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Smartphone, 
  Banknote, 
  CreditCard, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface PaymentDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { id: 'pix', label: 'Pix', icon: Smartphone, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'cash', label: 'Dinheiro', icon: Banknote, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'debit_card', label: 'Débito', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'credit_card', label: 'Crédito', icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { id: 'pending', label: 'Pendente', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-white/5' },
] as const;

export function PaymentDrawer({ isOpen, onOpenChange, appointment, onSuccess }: PaymentDrawerProps) {
  const { registerPayment } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (appointment && isOpen) {
      setAmount(appointment.service_price_snapshot?.toString() || "");
      setMethod(null);
      setNotes("");
    }
  }, [appointment, isOpen]);

  const handleRegister = async () => {
    if (!appointment || !method) {
      toast.error("Selecione uma forma de pagamento.");
      return;
    }
    
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    let timeoutId: any;

    try {
      setIsSubmitting(true);
      
      // Timeout protection (15 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("TIMEOUT"));
        }, 15000);
      });

      const status: PaymentStatus = method === 'pending' ? 'pending' : 'paid';
      
      const payload = {
        appointmentId: appointment.id,
        amount: numAmount,
        paymentMethod: method,
        status,
        notes
      };
      
      const registerPromise = registerPayment(payload);

      // Race between the request and the timeout
      const result = await Promise.race([registerPromise, timeoutPromise]) as any;
      clearTimeout(timeoutId);

      // Note: useMutation's onSuccess handles the toast and cache invalidation
      // but we need to check the result here to know if we should close the drawer
      if (result && result.success) {
        onOpenChange(false);
        onSuccess?.();
      }
      // If result.success is false, the hook already showed a toast error
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Technical error in PaymentDrawer:", error);
      
      if (error.message === "TIMEOUT") {
        toast.error("A operação demorou muito. Verificate sua conexão e tente novamente.");
      } else {
        // Only show generic error if it wasn't a handled RPC error
        // (Handled RPC errors return success: false and are caught by onSuccess hook)
        toast.error("Erro técnico ao processar pagamento. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-slate-900 border-white/5 rounded-[2.5rem] p-8 overflow-hidden">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold tracking-tighter">Concluir atendimento</DialogTitle>
          <p className="text-muted-foreground text-sm">Confirme os detalhes e o recebimento.</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appointment Summary */}
          <div className="bg-black/40 border border-white/5 p-5 rounded-3xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Cliente</p>
                <p className="text-sm font-bold">{appointment.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Serviço</p>
                <p className="text-sm font-bold">{appointment.service_name_snapshot}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Profissional</p>
                <p className="text-xs font-medium text-slate-300">{appointment.professionals?.name || "Otávio Carneiro"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Data/Hora</p>
                <p className="text-xs font-medium text-slate-300">
                  {format(parseISO(appointment.start_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Valor do serviço</Label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
              <Input 
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-black/40 border-white/5 rounded-2xl h-14 pl-12 text-lg font-bold tracking-tight focus:border-blue-500 transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Payment Methods Grid */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Como foi realizado o pagamento?</Label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                const isSelected = method === pm.id;
                
                return (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm.id as PaymentMethod)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 gap-2",
                      isSelected 
                        ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20 text-white" 
                        : "bg-black/40 border-white/5 hover:border-white/10 text-slate-400",
                      pm.id === 'pending' && !isSelected && "col-span-2 flex-row py-3"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isSelected ? "text-white" : pm.color)} />
                    <span className="text-xs font-bold">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={handleRegister} 
              className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/20" 
              disabled={isSubmitting || !method}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Finalizando...
                </span>
              ) : (
                "Finalizar Atendimento"
              )}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className="h-12 rounded-xl text-slate-500 hover:text-white"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

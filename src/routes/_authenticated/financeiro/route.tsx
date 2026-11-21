import { createFileRoute } from "@tanstack/react-router";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinance, useCashSession, usePendingPayments } from "@/hooks/useFinance";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  DEFAULT_TIMEZONE,
  getTenantPeriodBoundaries,
  tenantDayKey,
  type TenantPeriod,
} from "@/lib/timezone";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, DollarSign, ArrowUpCircle, ArrowDownCircle, Banknote, History, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { paymentMethodLabels, PaymentMethod, TransactionType } from "@/services/finance";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/financeiro")({
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { currentBarbershop } = useCurrentBarbershop();
  const [period, setPeriod] = useState<TenantPeriod>("today");
  const timezone = currentBarbershop?.timezone || DEFAULT_TIMEZONE;

  const rangeDates = useMemo(
    () => getTenantPeriodBoundaries(period, timezone),
    [period, timezone]
  );

  const { transactions, createTransaction, cancelTransaction } = useFinance(
    rangeDates.start,
    rangeDates.end
  );

  const { data: pendingAmount = 0 } = usePendingPayments();

  const income = transactions.filter(t => t.type === 'income' && t.status === 'active').reduce((acc, t) => acc + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense' && t.status === 'active').reduce((acc, t) => acc + Number(t.amount), 0);
  const result = income - expense;

  // Agrupamento por dia (no timezone do tenant) para as visões semana/mês
  const groupedByDay = useMemo(() => {
    const map = new Map<string, typeof transactions>();
    for (const t of transactions) {
      const key = tenantDayKey(t.occurred_at, timezone);
      const list = map.get(key) || [];
      list.push(t);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [transactions, timezone]);

  const periodLabel = period === 'today' ? 'Hoje' : period === 'week' ? 'Esta semana' : 'Este mês';


  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground text-sm">Controle total das finanças da Barbearia.</p>
        </div>
        <div className="flex gap-2">
            <NewTransactionDialog onAdd={createTransaction} />
        </div>
      </header>

      <div className="flex flex-wrap gap-1">
        {([
          ['today', 'Hoje'],
          ['week', 'Esta semana'],
          ['month', 'Este mês'],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            variant={period === value ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`Entradas (${periodLabel})`} value={`R$ ${income.toFixed(2).replace('.', ',')}`} icon={<ArrowUpCircle className="w-4 h-4 text-green-500" />} />
        <StatCard label={`Saídas (${periodLabel})`} value={`R$ ${expense.toFixed(2).replace('.', ',')}`} icon={<ArrowDownCircle className="w-4 h-4 text-red-500" />} />
        <StatCard label={`Resultado (${periodLabel})`} value={`R$ ${result.toFixed(2).replace('.', ',')}`} icon={<DollarSign className="w-4 h-4 text-primary" />} />
        <StatCard label="Pendente" value={`R$ ${pendingAmount.toFixed(2).replace('.', ',')}`} icon={<Banknote className="w-4 h-4 text-yellow-500" />} />
      </div>

      <Tabs defaultValue="movimentacoes">
        <div className="flex items-center justify-between overflow-x-auto">
          <TabsList className="grid grid-cols-3 w-full sm:w-[400px]">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="caixa">Caixa</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="movimentacoes" className="mt-6 space-y-4">
          {transactions.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
              Nenhuma movimentação no período.
            </div>
          ) : (
            groupedByDay.map(([dayKey, dayItems]) => {
              const dayIncome = dayItems.filter(t => t.type === 'income' && t.status === 'active').reduce((acc, t) => acc + Number(t.amount), 0);
              const dayExpense = dayItems.filter(t => t.type === 'expense' && t.status === 'active').reduce((acc, t) => acc + Number(t.amount), 0);
              return (
                <div key={dayKey} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {formatInTimeZone(parseISO(`${dayKey}T12:00:00Z`), 'UTC', "EEEE — dd/MM", { locale: ptBR })}
                    </h3>
                    <span className="text-xs font-semibold">
                      <span className="text-green-500">+ R$ {dayIncome.toFixed(2).replace('.', ',')}</span>
                      {dayExpense > 0 && <span className="text-red-500 ml-2">- R$ {dayExpense.toFixed(2).replace('.', ',')}</span>}
                    </span>
                  </div>
                  <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
                    {dayItems.map(t => (
                      <div key={t.id} className={cn("p-4 flex items-center justify-between hover:bg-accent/30 transition-colors", t.status === 'cancelled' && "opacity-50 italic")}>
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-full", t.type === 'income' ? "bg-green-500/10" : "bg-red-500/10")}>
                            {t.type === 'income' ? <ArrowUpCircle className="w-4 h-4 text-green-500" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{t.description}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {t.category || 'Outros'} • {formatInTimeZone(parseISO(t.occurred_at), timezone, "HH:mm")} • {paymentMethodLabels[t.payment_method as PaymentMethod] || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <p className={cn("font-bold text-sm", t.status === 'cancelled' ? "line-through text-muted-foreground" : t.type === 'income' ? "text-green-500" : "text-red-500")}>
                            {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toFixed(2).replace('.', ',')}
                          </p>
                          {t.status === 'active' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => cancelTransaction(t.id)}>
                              <History className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="caixa" className="mt-6">
          <CashModule
            periodLabel={periodLabel}
            periodStart={rangeDates.start}
            periodEnd={rangeDates.end}
            timezone={timezone}
          />
        </TabsContent>


        <TabsContent value="resumo" className="mt-6">
           <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                 <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receita por dia — {periodLabel}</p>
                 <p className="font-bold text-green-500">R$ {income.toFixed(2).replace('.', ',')}</p>
              </div>
              {groupedByDay.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">Nenhuma receita no período.</div>
              ) : (
                groupedByDay.map(([dayKey, dayItems]) => {
                  const dayIncome = dayItems.filter(t => t.type === 'income' && t.status === 'active').reduce((acc, t) => acc + Number(t.amount), 0);
                  const dayExpense = dayItems.filter(t => t.type === 'expense' && t.status === 'active').reduce((acc, t) => acc + Number(t.amount), 0);
                  return (
                    <div key={dayKey} className="p-4 flex items-center justify-between border-b border-border last:border-0">
                      <span className="text-sm capitalize">
                        {formatInTimeZone(parseISO(`${dayKey}T12:00:00Z`), 'UTC', "EEEE — dd/MM", { locale: ptBR })}
                      </span>
                      <span className="text-sm font-semibold">
                        <span className="text-green-500">+ R$ {dayIncome.toFixed(2).replace('.', ',')}</span>
                        {dayExpense > 0 && <span className="text-red-500 ml-3">- R$ {dayExpense.toFixed(2).replace('.', ',')}</span>}
                      </span>
                    </div>
                  );
                })
              )}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-card p-4 rounded-xl border border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function NewTransactionDialog({ onAdd }: { onAdd: any }) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: 'income' as TransactionType,
        description: '',
        amount: '',
        category: 'Outros',
        method: 'pix' as PaymentMethod,
        notes: ''
    });

    const handleSubmit = async () => {
        const val = parseFloat(formData.amount.replace(',', '.'));
        if (isNaN(val) || val <= 0) return;

        await onAdd({
            type: formData.type,
            description: formData.description,
            amount: val,
            category: formData.category,
            paymentMethod: formData.method,
            occurredAt: new Date().toISOString(),
            notes: formData.notes
        });
        setOpen(false);
        setFormData({
            type: 'income',
            description: '',
            amount: '',
            category: 'Outros',
            method: 'pix',
            notes: ''
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Nova Movimentação</span>
                    <span className="sm:hidden">Nova</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Nova Movimentação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant={formData.type === 'income' ? "default" : "outline"} onClick={() => setFormData({...formData, type: 'income'})}>Entrada</Button>
                        <Button variant={formData.type === 'expense' ? "default" : "outline"} onClick={() => setFormData({...formData, type: 'expense'})} className={cn(formData.type === 'expense' && "bg-red-500 hover:bg-red-600")}>Saída</Button>
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Ex: Venda de produto" />
                    </div>
                    <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0,00" />
                    </div>
                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Serviços">Serviços</SelectItem>
                                <SelectItem value="Produtos">Produtos</SelectItem>
                                <SelectItem value="Aluguel">Aluguel</SelectItem>
                                <SelectItem value="Energia">Energia</SelectItem>
                                <SelectItem value="Água">Água</SelectItem>
                                <SelectItem value="Internet">Internet</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} className="w-full">Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CashModule({
  periodLabel,
  periodStart,
  periodEnd,
  timezone,
}: {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  timezone: string;
}) {
  const { currentSession, openCash, closeCash, isOpening, isClosing, history } = useCashSession();
  const [amount, setAmount] = useState("");

  // Resumo do PERÍODO selecionado — sempre lido das transações persistidas,
  // independente de haver caixa aberto.
  const { transactions: periodTransactions } = useFinance(periodStart, periodEnd);

  // Saldo físico esperado do caixa: apenas transações em dinheiro desde a abertura.
  // O fim é fixado uma única vez por sessão para manter a queryKey estável.
  const sessionEnd = useMemo(
    () => (currentSession ? periodEnd : undefined),
    [currentSession?.id, periodEnd]
  );
  const { transactions: sessionTransactions } = useFinance(
    currentSession?.opened_at,
    sessionEnd
  );

  const cashMovements = sessionTransactions.filter(t => t.payment_method === 'cash' && t.status === 'active');
  const cashIncome = cashMovements.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const cashExpense = cashMovements.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const expectedBalance = currentSession ? Number(currentSession.opening_balance) + cashIncome - cashExpense : 0;

  const activePeriod = periodTransactions.filter(t => t.status === 'active' && t.type === 'income');
  const periodCashIncome = activePeriod.filter(t => t.payment_method === 'cash').reduce((acc, t) => acc + Number(t.amount), 0);
  const pixIncome = activePeriod.filter(t => t.payment_method === 'pix').reduce((acc, t) => acc + Number(t.amount), 0);
  const cardsIncome = activePeriod.filter(t => ['debit_card', 'credit_card'].includes(t.payment_method || '')).reduce((acc, t) => acc + Number(t.amount), 0);
  const periodTotalIncome = activePeriod.reduce((acc, t) => acc + Number(t.amount), 0);

  const periodByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of activePeriod) {
      const key = tenantDayKey(t.occurred_at, timezone);
      map.set(key, (map.get(key) || 0) + Number(t.amount));
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [periodTransactions, timezone]);

  const PeriodSummary = (
    <div className="bg-accent/10 p-6 rounded-xl border border-border border-dashed space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Recebimentos — {periodLabel}
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Dinheiro</span>
          <span className="font-semibold">R$ {periodCashIncome.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pix</span>
          <span className="font-semibold text-primary">R$ {pixIncome.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Cartões</span>
          <span className="font-semibold text-primary">R$ {cardsIncome.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
          <span>Total recebido</span>
          <span className="text-green-500">R$ {periodTotalIncome.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      <div className="pt-2 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Por dia</p>
        {periodByDay.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhum recebimento no período.</p>
        ) : (
          periodByDay.map(([dayKey, total]) => (
            <div key={dayKey} className="flex justify-between text-xs">
              <span className="capitalize text-muted-foreground">
                {formatInTimeZone(parseISO(`${dayKey}T12:00:00Z`), 'UTC', "EEEE — dd/MM", { locale: ptBR })}
              </span>
              <span className="font-semibold text-green-500">+ R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-background/50 rounded-lg">
        <p className="text-[10px] text-muted-foreground uppercase italic leading-tight">
          * Valores digitais entram diretamente na conta bancária e não afetam o saldo físico do caixa. O histórico é permanente e não depende do caixa aberto.
        </p>
      </div>
    </div>
  );


  if (!currentSession) {
    return (
      <div className="space-y-6">
        <div className="bg-card p-12 rounded-xl border border-dashed border-border text-center space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <p className="font-bold">Caixa fechado</p>
                <p className="text-xs text-muted-foreground">Abra o caixa para gerenciar movimentações em dinheiro físico.</p>
            </div>
            <div className="w-full max-w-[200px] space-y-4">
                <div className="text-left space-y-2">
                   <Label className="text-xs">Saldo inicial em dinheiro</Label>
                   <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
                </div>
                <Button onClick={() => openCash({ balance: parseFloat(amount.replace(',', '.')) || 0 })} disabled={isOpening} className="w-full">
                    Abrir Caixa
                </Button>
            </div>
        </div>

        <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <History className="w-4 h-4" /> Histórico recente
            </h3>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {history.map(s => (
                    <div key={s.id} className="p-4 flex items-center justify-between hover:bg-accent/30 border-b border-border last:border-0">
                        <div>
                            <p className="font-semibold text-sm">{format(parseISO(s.opened_at), "dd/MM/yyyy")}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{format(parseISO(s.opened_at), "HH:mm")} até {s.closed_at ? format(parseISO(s.closed_at), "HH:mm") : '...'}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-sm">R$ {Number(s.counted_closing_balance || 0).toFixed(2).replace('.', ',')}</p>
                            <p className={cn("text-[10px] font-bold uppercase", Number(s.difference) >= 0 ? "text-green-500" : "text-red-500")}>
                                Dif: {Number(s.difference) >= 0 ? '+' : ''}R$ {Number(s.difference || 0).toFixed(2).replace('.', ',')}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-bold">Caixa Aberto</p>
                    <p className="text-xs text-muted-foreground tracking-wider uppercase">Desde {format(parseISO(currentSession.opened_at), "HH:mm")}</p>
                </div>
                <div className="bg-green-500/20 text-green-500 p-2 rounded-full animate-pulse">
                    <Wallet className="w-4 h-4" />
                </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saldo inicial</span>
                    <span>R$ {Number(currentSession.opening_balance).toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entradas (Dinheiro)</span>
                    <span className="text-green-500 font-medium">+ R$ {cashIncome.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Saídas (Dinheiro)</span>
                    <span className="text-red-500 font-medium">- R$ {cashExpense.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Saldo Esperado</span>
                    <span className="text-primary">R$ {expectedBalance.toFixed(2).replace('.', ',')}</span>
                </div>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button className="w-full">Fechar Caixa</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Fechar Caixa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-accent/30 p-4 rounded-lg text-center">
                            <p className="text-xs uppercase font-bold text-muted-foreground">Saldo esperado em dinheiro</p>
                            <p className="text-2xl font-bold text-primary">R$ {expectedBalance.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Valor contado fisicamente</Label>
                            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => closeCash({ id: currentSession.id, balance: parseFloat(amount.replace(',', '.')) || 0 })} disabled={isClosing} className="w-full">
                            Confirmar Fechamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        <div className="bg-accent/10 p-6 rounded-xl border border-border border-dashed space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Resumo Digital (Hoje)</h3>
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total via Pix</span>
                    <span className="font-semibold text-primary">R$ {pixIncome.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total via Cartões</span>
                    <span className="font-semibold text-primary">R$ {cardsIncome.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="p-4 bg-background/50 rounded-lg mt-4">
                    <p className="text-[10px] text-muted-foreground uppercase italic leading-tight">
                        * Valores digitais entram diretamente na conta bancária e não afetam o saldo físico do caixa.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

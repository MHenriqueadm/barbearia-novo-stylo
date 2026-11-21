# Plano: Correção do Fluxo Agenda → Financeiro

Ajustar o fluxo de conclusão de atendimentos na Agenda administrativa para que a receita seja registrada corretamente no Financeiro e no Dashboard, garantindo consistência atômica e melhor UX.

## Alterações Funcionais

### 1. Banco de Dados (Supabase)
- **Bloqueio de Duplicidade**: Atualizar a RPC `register_appointment_payment` para verificar se já existe um pagamento `paid` antes de criar um novo (conforme requisito 7).
- **Status do Atendimento**: Garantir que a RPC atualize o status do `appointment` para `completed` ao registrar o pagamento.

### 2. Camada de Dados (Hooks & Services)
- **useAppointments**: Adicionar suporte para invalidação de cache do Dashboard quando o status mudar para `completed`.
- **useFinance**: Garantir que `registerPayment` invalide todos os recursos necessários (`appointments`, `payments`, `financial-transactions`, `financial-summary`, `dashboard-summary`).

### 3. Interface do Usuário (Agenda)
- **Fluxo de Confirmação**: O botão "Confirmar" passará a apenas alterar o status para `confirmed` (sem gerar receita).
- **Fluxo de Conclusão**:
    - O botão "Concluir" abrirá imediatamente o `PaymentDrawer`.
    - O atendimento só será marcado como `completed` após a seleção da forma de pagamento (incluindo a opção "Pendente").
- **PaymentDrawer**: 
    - Refatoração para um visual mais premium e mobile-first com botões grandes de seleção.
    - Exibição clara dos dados do atendimento (Cliente, Serviço, Profissional, Valor).
    - Opção "Pendente" que marca como concluído mas não gera receita ativa.
    - Implementação de `try/catch/finally` rigoroso para evitar loadings infinitos.

## Detalhes Técnicos

- **Arquivos a editar**:
    - `supabase/migrations/...`: Nova migração para reforçar a lógica da RPC.
    - `src/components/finance/PaymentDrawer.tsx`: Redesenho completo e lógica de integração.
    - `src/routes/agenda/route.tsx`: Alteração nos handlers de status.
- **RPC `register_appointment_payment`**: Será o coração da operação atômica, lidando com `appointment`, `payment` e `financial_transaction` em um único bloco de transação SQL.

---

Este ajuste garante que o faturamento hoje no Dashboard reflita os atendimentos pagos imediatamente.
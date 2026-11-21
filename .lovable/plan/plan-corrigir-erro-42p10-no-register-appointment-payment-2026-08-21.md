# Plan: Corrigir erro 42P10 no register_appointment_payment

O erro 42P10 (`there is no unique or exclusion constraint matching the ON CONFLICT specification`) ocorre na RPC `register_appointment_payment` porque ela tenta realizar um `INSERT ... ON CONFLICT (appointment_id)` na tabela `payments`, mas não existe uma constraint de unicidade na coluna `appointment_id`.

## User Review Required

> [!IMPORTANT]
> A solução proposta adiciona uma constraint UNIQUE em `payments(appointment_id)`. Isso significa que cada agendamento poderá ter apenas um registro de pagamento principal. Isso está alinhado com a solicitação de garantir idempotência e evitar duplicação de receita.

## Proposed Changes

### Database (Supabase)

#### 1. Criar Unique Constraint em `payments`
- Adicionar `UNIQUE (appointment_id)` na tabela `public.payments`.
- Como a tabela já possui dados, será verificado se existem duplicatas antes de aplicar.

#### 2. Corrigir RPC `register_appointment_payment`
- Auditar a RPC e garantir que o `ON CONFLICT` use a constraint correta.
- Garantir que o `barbershop_id` seja propagado corretamente para `payments` e `financial_transactions`.
- Garantir que a criação da `financial_transaction` seja idempotente (já existe um check de `v_transaction_id IS NULL`, mas podemos reforçar com um index único se necessário).

### Technical Details

- **Constraint**: `ALTER TABLE public.payments ADD CONSTRAINT payments_appointment_id_key UNIQUE (appointment_id);`
- **RPC Update**: A RPC atual já possui `ON CONFLICT (appointment_id)`, o que causa o erro justamente pela falta da constraint.

## Verification Plan

### Automated Tests
- Executar script Playwright para simular a finalização de um atendimento via Pix.
- Chamar a RPC diretamente via SQL para testar idempotência (chamadas repetidas).

### Manual Verification
1. Criar um agendamento de teste.
2. Finalizar o atendimento.
3. Verificar se o status mudou para `completed` e se os registros financeiros foram criados.
4. Tentar finalizar novamente e confirmar que não há erro 42P10 nem duplicação de valores no dashboard.

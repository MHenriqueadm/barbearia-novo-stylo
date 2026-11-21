# Plano de Implementação - Módulo Financeiro (Parte 7)

Este plano detalha a implementação do sistema financeiro completo para a Barbearia RESTYLE, incluindo gestão de pagamentos, movimentações financeiras e controle de caixa físico, com integração total à agenda e dashboard.

## Objetivos
- Registrar pagamentos de atendimentos com múltiplas formas (Pix, Dinheiro, Cartões, Pendente).
- Gestão de receitas avulsas e despesas.
- Controle de fluxo de caixa (abertura, fechamento e conferência).
- Interface mobile-first integrada ao fluxo administrativo.

## Detalhes Técnicos

### 1. Banco de Dados (Supabase)
- **Tabela `payments`**: Armazena o registro de pagamentos vinculados a atendimentos ou clientes.
- **Tabela `financial_transactions`**: Registro único de todas as entradas e saídas financeiras.
- **Tabela `cash_sessions`**: Controle de abertura e fechamento de caixa físico (apenas `cash`).
- **RPC `register_appointment_payment`**: Função atômica para criar pagamento e transação simultaneamente, evitando duplicidade.
- **Policies (RLS)**: Acesso autenticado total (conforme padrão do projeto).

### 2. Camada de Dados & Serviços
- `src/services/finance.ts`: Centraliza lógica de pagamentos, transações e caixa.
- `src/hooks/useFinance.ts`: Hooks do TanStack Query para gerenciamento de estado e cache.
- Lógica de Normalização: Todos os valores serão salvos como positivos, com o tipo (`income`/`expense`) definindo a operação. Timezone fixo em `America/Bahia`.

### 3. Interface do Usuário (UI)
- **Agenda**: Novo botão "Registrar Pagamento" em atendimentos concluídos. Exibição do status financeiro no card de detalhes.
- **Módulo Financeiro (`/financeiro`)**: 
  - Aba Resumo: Cards com métricas diárias.
  - Aba Movimentações: Lista detalhada com filtros de período e tipo.
  - Aba Caixa: Fluxo de abertura (saldo inicial) e fechamento (conferência de valor contado).
- **Dashboard**: Conectar o card de "Faturamento hoje" às transações reais em vez do snapshot da agenda.

### 4. Fluxo de Segurança e Integridade
- **Idempotência**: A RPC verificará se já existe um pagamento `paid` para o `appointment_id` antes de processar.
- **Caixa Físico**: Apenas transações em `cash` afetam o saldo esperado do caixa. Pix e Cartões são listados separadamente.
- **Estado Global**: Sincronização automática entre Agenda, Financeiro e Dashboard via invalidação de queries do TanStack Query.

---
Este módulo será construído respeitando a premissa de mobile-first e design premium dark já estabelecido.

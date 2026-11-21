# Auditoria Final RESTYLE

Auditoria completa do aplicativo para validar funcionalidades existentes, multi-tenancy, segurança e consistência antes do lançamento.

## Objetivos
- Validar fluxos de autenticação, onboarding e multi-tenant.
- Garantir isolamento de dados por RLS.
- Testar disponibilidade, agendamentos (admin/público) e financeiro.
- Eliminar erros de console e garantir build limpo.
- **Não adicionar novas funcionalidades.**

## Etapas de Execução

### 1. Autenticação e Onboarding
- **Teste:** Fluxo completo de cadastro, login, logout e persistência (F5).
- **Validação:** Garantir que novos usuários caiam no onboarding e que usuários com barbearia caiam no dashboard sem loops.
- **Correção:** Evitar duplicação de memberships e barbearias.

### 2. Multi-Tenant e RLS
- **Teste:** Acessar com Barbearia A e Barbearia B.
- **Validação:** Confirmar via rede/banco que uma barbearia não enxerga dados da outra (clientes, agenda, financeiro, etc.).
- **Segurança:** Rodar Security Scan e garantir 0 Critical.

### 3. Disponibilidade e Agendamento
- **Teste:** Criar agendamentos manuais (admin) e públicos (`/:slug/agendar`).
- **Validação:** Conflitos de horário, business breaks, professional breaks/blocks e duração dos serviços.
- **Timezone:** Verificar se os horários gravados correspondem aos exibidos (fixar -3h offset se necessário via `src/lib/timezone.ts`).

### 4. Configurações e Assets
- **Teste:** Alterar nome, logo, slug e localização.
- **Validação:** Persistência após F5 e exibição correta da logo (via proxy seguro `/api/public/assets`).

### 5. Financeiro e Dashboard
- **Teste:** Fluxo de pagamento (Pix/Pendente) e conclusão de agendamento.
- **Validação:** Dashboard reflete faturamento e próximos atendimentos corretamente por tenant.

### 6. Qualidade de Código e Build
- **Limpeza:** Eliminar Hydration errors, hook order errors e 404/403 de assets.
- **Build:** Executar `typecheck` e `build` completo.

## Relatório Final
Ao final, será entregue um resumo com:
- Status de cada módulo testado.
- Bugs encontrados e corrigidos.
- Resultados de segurança e build.
- Lista de sugestões de melhorias futuras (sem implementação).

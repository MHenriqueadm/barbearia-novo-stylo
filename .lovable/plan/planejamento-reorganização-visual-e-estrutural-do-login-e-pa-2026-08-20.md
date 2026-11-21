# Planejamento: Reorganização Visual e Estrutural do Login e Painel

Reorganização completa do fluxo de autenticação e layout administrativo para garantir separação total entre a área pública e a área da equipe.

## Alterações Propostas

### 1. Refinamento do Layout Administrativo (`_authenticated/route.tsx`)
- Centralização da lógica de proteção de rota e gerenciamento de sessão Supabase no cliente.
- Integração da `Sidebar` e `BottomNav` exclusivamente no layout autenticado.
- Movimentação definitiva da lógica de instalação PWA e banners de convite para o contexto autenticado.

### 2. Overhaul Visual da Página de Login (`auth.tsx`)
- Aplicação da estética "Premium Graphite/Electric Blue" (fundo preto, painéis em vidro fosco, sombras profundas).
- Inclusão dinâmica do logo e nome da barbearia (usando `useBarbershopSettings`).
- Design minimalista focado em conversão e profissionalismo.

### 3. Ajustes de Roteamento e Segurança
- Correção do redirecionamento na raiz (`/`) para a agenda (`/agenda`).
- Garantia de que a página de agendamento público (`/agendar`) utilize a nova RPC `get_busy_slots` para não expor dados de clientes anonimamente.

## Detalhes Técnicos
- Utilização de `createServerFn` e RPCs Supabase para validação segura.
- Gerenciamento de estado de hidratação para evitar "blank screens" no redirecionamento.
- Uso de `tanstack-router` para isolamento de layouts.

# Menu completo no mobile

Objetivo: dar acesso a todas as áreas administrativas pelo celular, sem alterar desktop, rotas, banco ou autenticação.

## O que muda

1. **Botão de menu (mobile/tablet)**
   - Cabeçalho fixo no topo, visível apenas até `md` (< 768px), com botão do ícone `Menu` (Lucide) no canto superior esquerdo.
   - Ao lado do botão, logo + nome da barbearia (dados reais do tenant).
   - Respeita `env(safe-area-inset-top)`.

2. **Drawer lateral**
   - Usa o `Sheet` já existente em `src/components/ui/sheet.tsx` (lado esquerdo), com backdrop escuro, fecha ao tocar fora e ao escolher um item.
   - Conteúdo com scroll e safe-area inferior, nenhum item cortado.

3. **Itens do menu (todos)**
   - Início, Agenda, Clientes, Serviços, Financeiro, Equipe, Configurações.
   - Item ativo destacado no mesmo estilo da Sidebar (azul).
   - Equipe navega para `/equipe` e fecha o drawer.

4. **Cabeçalho do drawer**
   - Logo da barbearia (com fallback de iniciais igual à Sidebar), nome do tenant e selo "RESTYLE Premium".

5. **Rodapé do drawer**
   - Usuário logado (e-mail/perfil) e botão Sair reutilizando o `supabase.auth.signOut()` já usado na Sidebar.

6. **Bottom Nav**
   - Mantida, reduzida a atalhos principais: Início, Agenda, Clientes, Serviços.
   - "Mais" (Financeiro/Equipe/Configurações) passa a viver no menu completo.

7. **Desktop**
   - Sidebar atual intacta; cabeçalho e drawer ficam `md:hidden`.

## Detalhes técnicos

- Novo componente `MobileNav` exportado de `src/components/layout/AppLayout.tsx` (mesma fonte de verdade da lista de itens, extraída para uma const compartilhada `NAV_ITEMS`).
- Montado em `src/routes/_authenticated/route.tsx` acima do `<main>`; `main` recebe padding-top no mobile para não ficar sob o header.
- Fechamento do drawer via estado local `open` + `onClick` nos `Link`.
- Sem mudanças em Agenda, booking público, Financeiro, serviços, RLS, Storage ou RPCs.

## Verificação

- Checagem visual com Playwright em larguras 375, 430 e 360 px: abrir menu, tocar em Equipe, confirmar `/equipe` e o botão "Novo profissional".
- Confirmar que em 1280 px o header/drawer não aparecem e a Sidebar segue idêntica.

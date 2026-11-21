# Plano: RESTYLE — SaaS Multi-tenant (Parte 2/3 - Bloco 1/4)

Este plano foca no onboarding de novos usuários, garantindo que cada novo cadastro resulte em um perfil isolado e, caso não possua uma barbearia vinculada, seja direcionado para a configuração de seu próprio espaço.

## Alterações de Banco de Dados (Supabase)

- **RPC `check_user_membership`**: Criar uma função `security definer` para verificar se o usuário atual possui alguma entrada ativa em `barbershop_users`.
- **Trigger `on_auth_user_created`**: Garantir que o nome fornecido no metadata do Auth (ou passado no signup) seja persistido na tabela `profiles`.
- **RLS**: Ajustar políticas para permitir que o usuário crie sua própria barbearia e membership durante o onboarding.

## Fluxo de Autenticação e Onboarding

- **Detecção de Membership**: 
  - No `AuthContext` ou no `_authenticated` layout gate, verificar se o usuário autenticado possui `barbershop_users`.
  - Se `session` ativa + `profile` ok + `membership` ausente -> Redirecionar para `/onboarding`.
- **Rota `/onboarding`**:
  - Nova rota pública (ou protegida por auth, mas fora do layout admin padrão).
  - Interface mobile-first, premium, sem Sidebar completa.
  - Wizard de 4 passos:
    1. Nome da barbearia (Obrigatório).
    2. Logo, Instagram, WhatsApp (Opcional).
    3. Localização e Timezone (Não assumir padrão fixo).
    4. Configuração inicial de horários (Aberto/Fechado, Horários).

## Perfil e Saudação Dinâmica

- **Dashboard**:
  - Atualizar a saudação para usar o nome do `profile` do usuário logado.
  - Implementar lógica para extrair o primeiro nome.
  - Remover qualquer texto estático "Otávio".

## Detalhes Técnicos

- **Contexto**: O `BarbershopContext` deve lidar com o estado de "sem barbearia selecionada" para permitir o fluxo de criação.
- **Persistence**: Ao concluir o onboarding, criar o registro em `barbershops`, associar o usuário em `barbershop_users` como `owner` e redirecionar para o dashboard.

---

**Critérios de Sucesso**:
1. Novo usuário é redirecionado para `/onboarding`.
2. Usuário com barbearia entra direto no `/agenda`.
3. Saudação no dashboard exibe o nome correto do usuário.
4. Nenhuma informação da barbearia do "Otávio" vaza para novas contas.
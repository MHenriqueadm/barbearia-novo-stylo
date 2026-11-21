# Plano RESTYLE — Parte 2: Configurações e Serviços

Implementar a persistência real de dados da barbearia, horários de funcionamento e serviços no Lovable Cloud (Supabase), transformando as páginas `/configuracoes` e `/servicos` em módulos funcionais.

## 1. Banco de Dados (Lovable Cloud)

Criar migração SQL com as tabelas fundamentais:
- `barbershop_settings`: Armazena nome, slug, contato e configurações de agendamento (Single-row).
- `business_hours`: Horários de abertura/fechamento por dia da semana (0-6).
- `services`: Cadastro de serviços com preço, duração e status.

*Nota: As permissões (GRANTs) serão configuradas para acesso público (`anon`) conforme solicitado, dado que o projeto não possui autenticação nesta fase.*

## 2. Camada de Dados (Services & Hooks)

- **`settingsService`**: Funções para buscar e atualizar configurações e horários.
- **`servicesService`**: CRUD completo de serviços (Listar, Criar, Editar, Excluir, Toggle Status).
- **React Query**: Implementar hooks (`useBarbershopSettings`, `useServices`, etc.) para cache, loading states (Skeletons) e invalidação automática após mutations.

## 3. UI - Configurações (`/configuracoes`)

- **Perfil**: Formulário para editar nome, redes sociais e endereço.
- **Horários**: Lista de dias da semana com `Switch` (Ativo/Inativo) e `Input` de horário (HH:mm). Validação para garantir que fechamento > abertura.
- **Agendamento**: Configuração do intervalo de slots (10m, 15m, 30m, 60m).
- **Logo**: Área de upload/preview (Placeholder visual por enquanto).

## 4. UI - Serviços (`/servicos`)

- **Listagem**: Tabela (desktop) ou Cards (mobile) exibindo nome, duração, preço e status.
- **Gestão**: Modal/Drawer para criação e edição de serviços.
- **Monetário**: Formatação BRL (R$) e persistência como numérico no banco.
- **Duração**: Seleção rápida de minutos (15, 30, 45, 60...).

## 5. Detalhes Técnicos
- **Mobile-First**: Garantir responsividade total (375px a 430px).
- **Feedback**: Toasts de sucesso/erro em todas as ações.
- **Persistência**: Garantir que o `F5` mantenha os dados (uso de loaders ou `useEffect` com Query).

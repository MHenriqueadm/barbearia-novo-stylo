# Implementação do Agendamento Público (/agendar)

Transformar a rota `/agendar` no canal oficial de agendamentos da Barbearia RESTYLE, permitindo que clientes agendem serviços de forma autônoma com persistência real no backend.

## Etapas

1. **Refatoração da Lógica de Disponibilidade**
   - Garantir que `availabilityService.getAvailableSlots` seja 100% reutilizável entre o painel administrativo e a página pública.
   - A disponibilidade deve respeitar: horário de funcionamento, agenda específica do profissional, pausas, bloqueios, agendamentos existentes e a duração do serviço selecionado.

2. **Criação do Fluxo de Agendamento (Interface)**
   - Criar `src/routes/agendar/route.tsx` com um layout "Mobile First" e visual "Dark Premium".
   - Implementar fluxo em etapas (Wizard):
     - ETAPA 1: Seleção de Serviço (apenas ativos).
     - ETAPA 2: Seleção de Profissional (filtrado por quem executa o serviço).
     - ETAPA 3: Seleção de Data (limite de 30 dias, bloqueando datas passadas ou dias fechados).
     - ETAPA 4: Seleção de Horário (chamando a mesma função de disponibilidade do Admin).
     - ETAPA 5: Dados do Cliente (Nome e WhatsApp com normalização).
     - ETAPA 6: Resumo e Confirmação.

3. **Backend Seguro e Integridade**
   - Utilizar a RPC `create_public_appointment` já criada para garantir que o agendamento seja atômico e seguro.
   - Implementar proteção contra agendamentos simultâneos no mesmo slot (concorrência).
   - Reutilizar a lógica de `customersService` para evitar duplicidade de clientes via telefone normalizado.
   - Salvar snapshots de preço, nome e duração no agendamento.
   - Gerar `confirmation_code` único (ex: RST-XXXXX).

4. **Experiência do Usuário e Integração**
   - Adicionar tela de sucesso com resumo e código de confirmação.
   - Botão para falar com a barbearia via WhatsApp após o agendamento.
   - Atualizar o Dashboard administrativo para exibir o link correto `/agendar` com funcionalidades de Copiar e Compartilhar.

## Detalhes Técnicos
- **Timezone**: Fixo em `America/Bahia` para todos os cálculos.
- **Segurança**: RLS e RPCs para garantir que o cliente público veja apenas slots livres e serviços, sem acessar dados sensíveis.
- **Estilização**: Tailwind v4, modo dark, fontes Manrope, ícones Lucide.
- **Estado**: Gerenciamento de formulário local + TanStack Query para persistência e cache.

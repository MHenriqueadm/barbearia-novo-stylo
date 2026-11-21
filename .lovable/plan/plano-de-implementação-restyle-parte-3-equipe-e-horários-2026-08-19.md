# Plano de Implementação - RESTYLE Parte 3: Equipe e Horários

Implementar o módulo de Equipe com gestão de profissionais, vínculos de serviços, horários específicos, pausas e bloqueios, persistindo tudo no Supabase.

## 1. Banco de Dados (Supabase)
Criar migração SQL para:
- Tabela `professionals`: Cadastro de barbeiros (incluindo seed para Otávio Carneiro).
- Tabela `professional_services`: Vínculo N:N entre profissionais e serviços.
- Tabela `professional_schedules`: Horários específicos por dia da semana.
- Tabela `professional_breaks`: Pausas recorrentes (ex: almoço).
- Tabela `professional_blocks`: Bloqueios pontuais (ex: folga, médico).
- Configurar RLS e GRANTs para acesso público (`anon`).

## 2. Camada de Dados (Service & Hooks)
- `src/services/professionals.ts`: Implementar CRUD e lógica de negócios (herança de horários).
- `src/hooks/useProfessionals.ts`: Criar hooks React Query para todas as novas entidades.

## 3. Interface da Equipe (`/equipe`)
- Listagem de profissionais em cards responsivos (Mobile-first).
- Modal/Drawer para:
    - Cadastro/Edição de profissional.
    - Gestão de Serviços vinculados (Checkboxes com "Selecionar todos").
    - Gestão de Horários (com validação contra `business_hours`).
    - Gestão de Pausas e Bloqueios (Dia inteiro, timezone `America/Bahia`).

## 4. Validações e Regras
- Impedir horários do profissional fora do horário da barbearia.
- Impedir pausas fora do expediente do profissional.
- Garantir persistência dos dados (F5).

## Detalhes Técnicos
- Timezone fixo: `America/Bahia`.
- Componentes: Radix UI (Dialog/Drawer), Lucide Icons, Shadcn UI.
- Feedback: Sonner (toasts) e Skeletons para carregamento.

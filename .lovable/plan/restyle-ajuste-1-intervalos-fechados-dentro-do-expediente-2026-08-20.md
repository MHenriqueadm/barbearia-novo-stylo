# RESTYLE — AJUSTE 1: INTERVALOS FECHADOS DENTRO DO EXPEDIENTE

Implementação de intervalos fechados (business breaks) para a barbearia, permitindo que o estabelecimento fique temporariamente indisponível durante o horário de funcionamento padrão (ex: almoço).

## O que será feito

### Banco de Dados
- Criar a tabela `business_breaks` para armazenar os intervalos recorrentes por dia da semana.
- Implementar políticas de RLS e GRANTs para permitir leitura pública e gerenciamento por usuários autenticados.

### Lógica de Disponibilidade
- Atualizar `availabilityService.getAvailableSlots` para subtrair os `business_breaks` da disponibilidade geral.
- A regra garante que um serviço não possa ser agendado se ele terminar ou começar dentro de um intervalo fechado da barbearia.

### Interface Administrativa
- Adicionar seção "Intervalos fechados" em `/configuracoes` sob cada dia da semana.
- Interface para adicionar, editar e remover intervalos com validações de horário e sobreposição.

### Integração
- Garantir que tanto a Agenda administrativa quanto o Agendamento Público (`/agendar`) respeitem os mesmos bloqueios.

## Detalhes Técnicos
- **Nova Tabela**: `business_breaks` (weekday, start_time, end_time, label, active).
- **Validação**: Não permitir `end_time <= start_time`, intervalos fora do expediente da barbearia ou sobreposições entre intervalos.
- **Timezone**: Manter o uso rigoroso de `America/Bahia` para todos os cálculos.

## Passos de Execução
1. Executar migration SQL para a nova tabela e permissões.
2. Atualizar `src/services/barbearia.ts` com métodos CRUD para business breaks.
3. Atualizar `src/hooks/useBarbearia.ts` com hooks do React Query para os breaks.
4. Refatorar `src/services/availability.ts` para integrar a verificação de breaks da barbearia.
5. Implementar a interface de gerenciamento em `src/routes/configuracoes/route.tsx`.
6. Validar com testes automatizados e manuais conforme solicitado.

# Plano de Implementação - RESTYLE PARTE 4

Transformar o módulo de Agenda em uma ferramenta administrativa completa com gestão de disponibilidade real e persistência no banco de dados.

## 1. Banco de Dados
- Criar tabela `appointments` com suporte a snapshots de serviço (nome, preço, duração).
- Implementar proteção contra conflitos de horário via trigger/função no banco para garantir que dois agendamentos não ocupem o mesmo profissional simultaneamente.

## 2. Lógica de Disponibilidade (Availability Engine)
- Criar `availabilityService` centralizado para calcular slots disponíveis.
- Integrar:
    - Horários da barbearia e do profissional (com herança).
    - Pausas recorrentes e bloqueios pontuais.
    - Duração do serviço (o serviço deve caber inteiramente no slot).
    - Agendamentos existentes.
- Garantir uso do timezone `America/Bahia`.

## 3. Interface da Agenda (/agenda)
- **Navegação**: Seletor de data e botões para "Hoje", "Anterior" e "Próximo".
- **Visual**: Lista cronológica otimizada para mobile e timeline vertical para desktop.
- **Drawer de Novo Agendamento**: Fluxo passo a passo (Serviço > Profissional > Data/Hora > Cliente).
- **Gestão**: Modais para editar, reagendar, confirmar, concluir ou cancelar atendimentos.

## 4. Integração com Dashboard
- Conectar os cards de "Agendamentos hoje" e "Próximo atendimento" aos dados reais do banco.

## Detalhes Técnicos
- Utilização de `date-fns` e `date-fns-tz` para manipulação segura de datas.
- `appointmentsService` para todas as operações de CRUD.
- Invalidação de cache via TanStack Query para manter a UI sincronizada.

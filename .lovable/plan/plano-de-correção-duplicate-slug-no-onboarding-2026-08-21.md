# Plano de Correção: Duplicate Slug no Onboarding

Corrigir a falha de restrição de unicidade no `barbershop_settings.slug` e unificar a gestão de slugs através da tabela principal `barbershops`.

## Alterações

### Banco de Dados (Supabase)
- Criar migração para remover a restrição `UNIQUE` do campo `slug` na tabela `barbershop_settings`.
- Adicionar restrição `UNIQUE` no campo `barbershop_id` na tabela `barbershop_settings` para garantir um registro de configuração por tenant.
- Atualizar a RPC `create_barbershop_onboarding` para:
  - Garantir que `p_slug` atribuído à `barbershops` seja o mesmo inserido em `barbershop_settings`.
  - Melhorar a lógica de colisão de slug para ser mais robusta.

### Frontend
- Ajustar `barbershopService` para priorizar a busca por `barbershops.id` ou `barbershops.slug`.
- Validar se o `OnboardingPage` envia os dados corretamente para a RPC.

## Detalhes Técnicos
- O erro `barbershop_settings_slug_key` ocorre porque a lógica de colisão na RPC altera `p_slug` para `barbershops`, mas pode haver inconsistência ou tentativas de reuso do slug original em `barbershop_settings`.
- Ao remover a unicidade do slug em `settings`, evitamos conflitos redundantes, já que a unicidade global é garantida pela tabela `barbershops`.

## Verificação
1. Testar criação de duas barbearias com nome idêntico ("Barbearia Central").
2. Confirmar que a segunda recebe um slug sufixado (ex: `barbearia-central-123`) e que `barbershop_settings` reflete esse valor exatamente.
3. Verificar idempotência: tentar rodar o onboarding para um usuário que já possui tenant.

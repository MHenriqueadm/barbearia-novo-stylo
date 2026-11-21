# Validar geração automática de slug no onboarding

Objetivo: provar, com um teste real no banco, que `create_barbershop_onboarding` não falha quando o slug base já existe, e que ela cria barbearia, vínculo de proprietário, configurações e horários.

Nenhum arquivo do frontend será alterado. `src/routes/index.tsx` não será tocado.

## O que já foi verificado (somente leitura)

- A função ativa já contém: trava por slug, laço que acrescenta sufixo (`-2`, `-3`, ...) enquanto o slug existir, e reaproveitamento de barbearia quando o usuário já é proprietário de uma.
- Já existe o slug `barbearia-da-bia` ocupado, ideal como slug base do teste.
- Existem dois usuários de login sem nenhum vínculo de barbearia; um deles serve como usuário do teste (o vínculo criado é removido no final).

## Passos do teste

1. Registrar o estado inicial: slugs existentes que comecem com o slug base.
2. Executar a função com nome "Barbearia da Bia" e slug base `barbearia-da-bia`, usando um usuário existente sem vínculo, com 7 dias de horário de funcionamento.
3. Ler o resultado: qual slug final foi gerado.
4. Conferir as quatro criações: barbearia, vínculo de proprietário, configurações e horários (contagem esperada: 7).
5. Confirmar que nenhum erro de slug duplicado ocorreu.
6. Remover tudo o que o teste criou: horários, configurações, vínculo e a barbearia — deixando o banco exatamente como estava.

## Detalhes técnicos

- Execução via ferramenta de escrita de dados (`run_sql`), não migração: nada de mudança de esquema.
- Usuário de teste: usuário existente em `auth.users` sem linha em `barbershop_users` (não criamos nem apagamos usuários; o schema `auth` não é alterado). Isso é necessário porque a função reaproveita a barbearia quando o usuário já tem vínculo de proprietário ativo, o que anularia o teste de colisão de slug.
- Limpeza na ordem: `business_hours` → `barbershop_settings` → `barbershop_users` → `barbershops`, filtrando pelo id retornado pela função.
- Se a execução falhar por `barbershops_slug_key`, o resultado é reportado como falha e o laço de sufixo é corrigido antes de nova tentativa.

## Resposta final

Ao terminar, responderei somente no formato pedido: slug base, slug final, RPC executada, barbershop criada, membership criada, settings criadas, horários criados, erro de slug duplicado, dados de teste removidos.

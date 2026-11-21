# Plano de Correção: Erro 409 (Slug Duplicado) na Identidade da Barbearia

O objetivo é corrigir o erro `23505 (unique_violation)` ao salvar as configurações de identidade, garantindo que a validação de slug seja feita corretamente no lado do cliente e do servidor, sem violar a restrição de unicidade e permitindo que a barbearia atual mantenha seu próprio slug.

## Alterações Técnicas

### 1. Frontend: Refinamento da Validação de Slug
- **Arquivo:** `src/routes/_authenticated/configuracoes/route.tsx`
- **Ação:** Ajustar a função `handleSave` para realizar uma normalização robusta do slug e uma verificação de disponibilidade que ignore o ID da barbearia atual.
- **Normalização:** Converter para minúsculas, remover acentos, substituir espaços e caracteres especiais por hífens.

### 2. Backend: Serviço de Configurações
- **Arquivo:** `src/services/barbearia.ts`
- **Ação:** Garantir que o `updateBarbershopSettings` receba o ID correto e que a atualização na tabela `barbershops` seja feita apenas para aquele ID específico.
- **Idempotência:** Adicionar uma camada de segurança extra no serviço para evitar tentativas de UPDATE se o slug já estiver em uso por outro ID.

### 3. Garantia de Tenant no Contexto
- **Arquivo:** `src/contexts/BarbershopContext.tsx`
- **Ação:** Verificar se o carregamento da barbearia está utilizando critérios estritos de associação (`user_id` + `active: true`) para evitar a seleção de tenants incorretos.

## Critérios de Sucesso (Testes)
- [ ] Alterar apenas o nome: Sucesso.
- [ ] Alterar apenas a logo: Sucesso.
- [ ] Salvar sem alterações: Sucesso.
- [ ] Mudar para um slug livre: Sucesso.
- [ ] Tentar usar slug de outra barbearia: Exibir erro amigável "Este endereço já está sendo utilizado por outra barbearia".
- [ ] Erro 409 (PostgREST) não deve ocorrer em fluxos normais.

## Detalhes Adicionais
- A restrição `barbershops_slug_key` no banco de dados será mantida.
- O slug será normalizado via Regex no `handleSave` e no `onChange` do campo.

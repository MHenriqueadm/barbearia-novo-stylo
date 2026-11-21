# Plano de Segurança SaaS Multi-tenant (Parte 1/3 - Critical)

Este plano visa corrigir as vulnerabilidades críticas de segurança, garantindo o isolamento de dados entre barbearias (tenants) e bloqueando o acesso público (anon) a dados sensíveis.

## 1. Isolamento Multi-tenant (Base)
A estrutura de segurança será baseada no vínculo entre o usuário autenticado (`auth.uid()`) e as barbearias nas quais ele possui uma membership ativa (`barbershop_users`).

## 2. Tabelas Financeiras (Privadas)
As tabelas `payments`, `financial_transactions` e `cash_sessions` serão restritas apenas a usuários autenticados que pertençam à barbearia do registro.
- **Ação:** Revogar todos os privilégios `SELECT`, `INSERT`, `UPDATE`, `DELETE` do papel `anon`.
- **RLS:** Implementar políticas que validam se o `barbershop_id` do registro consta na lista de barbearias do usuário.

## 3. Dados de Clientes e Agendamentos
Proteção de PII (Informações Pessoais Identificáveis).
- **Ação:** Bloquear acesso `SELECT`, `INSERT`, `UPDATE`, `DELETE` direto para `anon`.
- **Booking Público:** Continuará funcionando via RPC `create_public_appointment` (que já possui privilégio `EXECUTE` para `anon`).
- **Appointments:** O usuário anônimo não poderá listar agendamentos. A verificação de disponibilidade deve ser feita via RPC segura que retorne apenas slots de tempo, sem dados do cliente.

## 4. Storage (Buckets)
Auditoria e proteção de arquivos.
- **READ:** Permitido para anônimos em buckets de mídia (logos, fotos de serviços, avatares).
- **Escrita/Exclusão:** Restrito a usuários autenticados vinculados ao tenant proprietário do arquivo.

## Detalhes Técnicos

### Funções Auxiliares
Implementação de funções `SECURITY DEFINER` para evitar recursividade no RLS:
- `is_barbershop_member(user_id, barbershop_id)`: Verifica se o usuário tem acesso ao tenant.

### Migrações SQL
O processo seguirá a ordem obrigatória:
1. Revogação de privilégios (`REVOKE`).
2. Concessão de privilégios específicos (`GRANT`).
3. Criação/Atualização de políticas RLS.

```sql
-- Exemplo de política para payments
CREATE POLICY "Users can manage their tenant payments" 
ON public.payments 
FOR ALL 
TO authenticated 
USING (public.is_barbershop_member(auth.uid(), barbershop_id));
```

## Validação
- **Testes Playwright:** Verificar se o booking público continua funcionando.
- **Queries Diretas:** Tentar acessar tabelas como `anon` e confirmar o bloqueio (HTTP 401/403 ou 0 resultados).
- **Build:** Garantir que as alterações não quebram o deploy.

---
**Nota:** Não serão corrigidos nesta fase os avisos de `SECURITY DEFINER` (warnings amarelos), focando apenas nos itens `CRITICAL`.

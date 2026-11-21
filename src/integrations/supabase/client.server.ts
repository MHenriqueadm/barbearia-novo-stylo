import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

/**
 * Recupera variáveis de ambiente em tempo de execução.
 * Em TanStack Start na Cloudflare, os bindings são injetados no contexto global (globalThis).
 */
export function getEnv(key: string, explicitEnv?: any): string | undefined {
  // 1. Explicit env from Cloudflare handler (preferred)
  if (explicitEnv && explicitEnv[key]) return explicitEnv[key];

  // 2. globalThis.env (Injected by src/server.ts via TanStack handler fetch)
  const g = (globalThis as any);
  if (g.env && g.env[key]) return g.env[key];

  // 3. globalThis direct
  if (g[key]) return g[key];

  // 4. Runtime env (process.env or import.meta.env)
  return (
    (typeof process !== 'undefined' ? process.env[key] : undefined) ||
    (import.meta as any).env?.[key]
  );
}

export function createSupabaseAdminClient(explicitEnv?: any) {
  const SUPABASE_URL = getEnv('SUPABASE_URL', explicitEnv);
  const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY', explicitEnv);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(`Missing Supabase environment variable(s). URL: ${!!SUPABASE_URL}, KEY: ${!!SUPABASE_SERVICE_ROLE_KEY}`);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY),
    },
    auth: {
      persistSession: false,
    }
  });
}


let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    try {
      if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
      return Reflect.get(_supabaseAdmin, prop, receiver);
    } catch (err) {
      // Re-throw so the handler can catch it
      throw err;
    }
  },
});

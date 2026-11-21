import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/debug-env')({
  server: {
    handlers: {
      GET: async (args: any) => {
        const { request, ...rest } = args;
        const env = (globalThis as any);
        
        const debug = {
          has_global_url: !!env['SUPABASE_URL'],
          has_global_key: !!env['SUPABASE_SERVICE_ROLE_KEY'],
          context_keys: Object.keys(rest),
          // @ts-ignore - checking for vinxi/h3 internal context
          h3_event_keys: args.event ? Object.keys(args.event) : 'no event',
          // @ts-ignore
          h3_context_keys: args.event?.context ? Object.keys(args.event.context) : 'no event context',
          global_keys: Object.keys(globalThis).filter(k => k.includes('SUPABASE') || k === 'env'),
        };

        return new Response(JSON.stringify(debug, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      }


    }
  }
});

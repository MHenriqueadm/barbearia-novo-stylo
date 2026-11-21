import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Scissors, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccessState } from "@/hooks/useAccessState";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";



const credentialsSchema = z.object({
  email: z.string().trim().email({ message: "Informe um e-mail válido" }).max(255),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres" }).max(72),
});

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Acesso da equipe | Gestão da Barbearia" },
      { name: "description", content: "Área restrita: entre com sua conta para gerenciar agenda, clientes e financeiro." },
      { property: "og:title", content: "Acesso da equipe | Gestão da Barbearia" },
      { property: "og:description", content: "Área restrita da equipe da barbearia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  

  const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/dashboard";
  const { state, isLoading: accessLoading } = useAccessState();

  useEffect(() => {
    if (accessLoading) return;

    if (state === 'AUTHENTICATED_WITH_BARBERSHOP') {
      // Evitar loop se já estivermos no destino ou se o destino for a própria página de auth
      if (!target.includes('/auth')) {
        router.navigate({ href: target, replace: true });
      } else {
        router.navigate({ to: '/dashboard', replace: true });
      }
    } else if (state === 'AUTHENTICATED_NO_BARBERSHOP') {
      router.navigate({ to: '/onboarding' as any, replace: true });
    }
  }, [state, accessLoading, router, target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "signup") {
      if (!name.trim()) {
        toast.error("O nome é obrigatório");
        return;
      }
      if (password.length < 8) {
        toast.error("A senha deve ter no mínimo 8 caracteres");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }
    }

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          toast.error(
            error.message.includes("Invalid login")
              ? "E-mail ou senha incorretos."
              : error.message,
          );
          return;
        }
        toast.success("Bem-vindo de volta!");
        router.navigate({ href: target, replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { 
            emailRedirectTo: window.location.origin,
            data: { name }
          },
        });
        if (error) {
          toast.error(
            error.message.includes("already registered")
              ? "Este e-mail já possui uma conta. Faça login."
              : error.message,
          );
          return;
        }
        if (data.session) {
          toast.success("Conta criada com sucesso!");
          router.navigate({ href: target, replace: true });
        } else {
          setEmailSent(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-6">
        <div className="w-full max-w-sm text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 mx-auto rounded-[2rem] bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <Scissors className="w-10 h-10 text-blue-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter text-white">Confirme seu e-mail</h1>
            <p className="text-sm text-slate-400">
              Enviamos um link de confirmação para <span className="font-semibold text-slate-200">{email}</span>.
            </p>
          </div>
          <Button variant="outline" className="w-full h-12 rounded-2xl border-white/10 text-white bg-slate-900/50 hover:bg-slate-900" onClick={() => { setEmailSent(false); setMode("signin"); }}>
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-12 flex flex-col items-center">
          <img 
            src="/logo-restyle.png" 

            alt="RESTYLE" 
            className="w-48 h-auto object-contain"
          />
          <h1 className="mt-6 text-2xl font-bold tracking-tighter text-white">Acesso ao RESTYLE</h1>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "signup" && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <Label htmlFor="name" className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="h-14 rounded-2xl bg-black/40 border-white/5 focus:border-blue-500/50 text-white placeholder:text-slate-700 transition-all"
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                maxLength={255}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@barbearia.com"
                className="h-14 rounded-2xl bg-black/40 border-white/5 focus:border-blue-500/50 text-white placeholder:text-slate-700 transition-all"
                required
              />
            </div>
            
            <div className="space-y-2 relative">
              <Label htmlFor="password" className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  maxLength={72}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-14 rounded-2xl bg-black/40 border-white/5 focus:border-blue-500/50 text-white placeholder:text-slate-700 transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <Label htmlFor="confirmPassword" className="text-slate-400 text-[10px] uppercase font-bold tracking-widest ml-1">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-14 rounded-2xl bg-black/40 border-white/5 focus:border-blue-500/50 text-white placeholder:text-slate-700 transition-all"
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "signin" ? "Entrar no Painel" : "Criar Acesso"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-8 w-full text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            {mode === "signin" ? "Não tem conta? Criar acesso" : "Já tem conta? Entrar"}
          </button>
        </div>

      </div>
    </div>
  );
}
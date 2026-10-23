import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, MailCheck, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import courierImg from "@/assets/courier-scooter.png";
import { BottomSheet } from "@/components/foodup/BottomSheet";
import { Logo } from "@/components/foodup/Logo";
import { PillButton } from "@/components/foodup/PillButton";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar | FoodUp" },
      { name: "description", content: "Entre ou crie sua conta no FoodUp para pedir comida com entrega rápida." },
      { property: "og:title", content: "Entrar | FoodUp" },
      { property: "og:description", content: "Entre ou crie sua conta no FoodUp para pedir comida com entrega rápida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Informe um e-mail válido").max(255);
const passwordSchema = z.string().min(6, "A senha precisa de pelo menos 6 caracteres").max(72);

function safePath(p: string | undefined) {
  if (!p) return "/inicio";
  try {
    const u = new URL(p, window.location.origin);
    if (u.origin !== window.location.origin) return "/inicio";
    const path = u.pathname + u.search;
    return path.startsWith("/auth") || path === "/" ? "/inicio" : path;
  } catch {
    return "/inicio";
  }
}

function friendlyError(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar.";
  if (/already registered/i.test(msg)) return "Este e-mail já tem uma conta. Faça login.";
  if (/rate limit/i.test(msg)) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
  if (/pwned|leaked|compromised/i.test(msg)) return "Esta senha é insegura. Escolha outra.";
  return msg;
}

function AuthPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [keep, setKeep] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const goNext = () => router.history.push(safePath(redirect));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goNext();
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) goNext();
    });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rememberChoice = () => {
    if (keep) {
      localStorage.removeItem("foodie-ephemeral");
    } else {
      localStorage.setItem("foodie-ephemeral", "1");
      sessionStorage.setItem("foodie-tab", "1");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const em = emailSchema.safeParse(email);
    const pw = passwordSchema.safeParse(password);
    if (!em.success) errs.email = em.error.issues[0].message;
    if (!pw.success) errs.password = pw.error.issues[0].message;
    if (mode === "signup" && name.trim().length < 2) errs.name = "Informe seu nome";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    rememberChoice();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: em.data!, password });
      setLoading(false);
      if (error) return toast.error(friendlyError(error.message));
      toast.success("Bem-vindo de volta!");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: em.data!,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim() } },
      });
      setLoading(false);
      if (error) return toast.error(friendlyError(error.message));
      if (!data.session) setSentTo(em.data!);
    }
  };

  const social = async (provider: "google" | "apple") => {
    rememberChoice();
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error("Não foi possível entrar. Tente novamente.");
  };

  return (
    <div className="min-h-screen bg-muted/60">
      <div className="mx-auto min-h-screen w-full max-w-md bg-card">
        <header className="relative h-60 overflow-hidden rounded-b-[36px] bg-gradient-header px-6 pt-10">
          <Logo light className="text-3xl" />
          <p className="mt-2 max-w-[150px] text-sm leading-snug text-primary-foreground/85">
            Comida quente, direto na sua porta.
          </p>
          <img
            src={courierImg}
            alt=""
            width={1024}
            height={1024}
            className="absolute -bottom-3 -right-4 w-56 animate-float"
          />
        </header>

        {sentTo ? (
          <div className="animate-page-in px-6 py-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
              <MailCheck className="h-9 w-9" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Confirme seu e-mail</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enviamos um link para <strong className="text-foreground">{sentTo}</strong>. Abra-o para ativar sua conta.
            </p>
            <PillButton variant="outline" className="mt-8 w-full" onClick={() => { setSentTo(null); setMode("login"); }}>
              Voltar para o login
            </PillButton>
          </div>
        ) : (
          <div className="animate-page-in px-6 pb-10 pt-7">
            <h1 className="text-2xl font-bold text-foreground">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login" ? "Entre para continuar seus pedidos." : "Leva menos de um minuto."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-3.5" noValidate>
              {mode === "signup" && (
                <Field icon={<User className="h-4 w-4" />} error={errors.name}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    aria-label="Nome"
                  />
                </Field>
              )}
              <Field icon={<Mail className="h-4 w-4" />} error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  autoComplete="email"
                  inputMode="email"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  aria-label="E-mail"
                />
              </Field>
              <Field icon={<Lock className="h-4 w-4" />} error={errors.password}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  aria-label="Senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                  className="text-muted-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={keep} onCheckedChange={(v) => setKeep(v === true)} />
                  Manter conectado
                </label>
                {mode === "login" && (
                  <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-semibold text-primary-deep">
                    Esqueci a senha
                  </button>
                )}
              </div>

              <PillButton type="submit" loading={loading} className="mt-2 w-full">
                {mode === "login" ? "Entrar" : "Criar conta"}
              </PillButton>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> ou continue com <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <PillButton variant="outline" size="md" onClick={() => social("google")}>
                <GoogleIcon /> Google
              </PillButton>
              <PillButton variant="outline" size="md" onClick={() => social("apple")}>
                <AppleIcon /> Apple
              </PillButton>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); }}
                className="font-bold text-primary-deep"
              >
                {mode === "login" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </div>
        )}
      </div>
      <ForgotPasswordSheet open={forgotOpen} onOpenChange={setForgotOpen} initialEmail={email} />
    </div>
  );
}

function Field({ icon, error, children }: { icon: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className={cn(
          "flex h-13 items-center gap-3 rounded-full bg-input px-5 text-muted-foreground ring-1 ring-transparent transition focus-within:bg-card focus-within:ring-primary",
          error && "ring-destructive",
        )}
      >
        {icon}
        {children}
      </div>
      {error && <p className="mt-1 pl-5 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function ForgotPasswordSheet({
  open,
  onOpenChange,
  initialEmail,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (open) { setEmail(initialEmail); setSent(false); }
  }, [open, initialEmail]);

  const send = async () => {
    const r = emailSchema.safeParse(email);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(r.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(friendlyError(error.message));
    setSent(true);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Esqueci a senha" description="Enviaremos um link para você criar uma nova senha.">
      <div className="space-y-4 px-5 pb-8 pt-2">
        {sent ? (
          <p className="rounded-2xl bg-primary-soft p-4 text-sm text-primary-deep">
            Pronto! Se existir uma conta com esse e-mail, você receberá o link em instantes.
          </p>
        ) : (
          <>
            <Field icon={<Mail className="h-4 w-4" />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="E-mail para recuperação"
              />
            </Field>
            <PillButton className="w-full" loading={loading} onClick={send}>
              Enviar link
            </PillButton>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M16.37 12.62c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.65zM14.1 5.88c.63-.77 1.06-1.83.94-2.88-.91.04-2.01.6-2.66 1.37-.58.67-1.09 1.75-.95 2.78 1.01.08 2.04-.51 2.67-1.27z" />
    </svg>
  );
}

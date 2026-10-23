import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/foodup/Logo";
import { PillButton } from "@/components/foodup/PillButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha | FoodUp" },
      { name: "description", content: "Crie uma nova senha para sua conta FoodUp." },
      { property: "og:title", content: "Nova senha | FoodUp" },
      { property: "og:description", content: "Crie uma nova senha para sua conta FoodUp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session && isRecovery) setReady(true);
      else if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const save = async () => {
    if (password.length < 6) return toast.error("A senha precisa de pelo menos 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não coincidem.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/inicio", replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/60">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-card px-6 py-12">
        <Logo className="text-3xl" />
        <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
          <KeyRound className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Crie uma nova senha</h1>
        {!ready ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Abra esta página pelo link enviado ao seu e-mail. Se o link expirou, peça um novo na tela de login.
          </p>
        ) : (
          <div className="mt-6 space-y-3.5">
            {[{ v: password, s: setPassword, p: "Nova senha" }, { v: confirm, s: setConfirm, p: "Confirme a senha" }].map((f) => (
              <div key={f.p} className="flex h-13 items-center gap-3 rounded-full bg-input px-5 text-muted-foreground focus-within:ring-1 focus-within:ring-primary">
                <Lock className="h-4 w-4" />
                <input
                  type="password"
                  value={f.v}
                  onChange={(e) => f.s(e.target.value)}
                  placeholder={f.p}
                  aria-label={f.p}
                  autoComplete="new-password"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            ))}
            <PillButton className="w-full" loading={loading} onClick={save}>
              Salvar nova senha
            </PillButton>
          </div>
        )}
      </div>
    </div>
  );
}

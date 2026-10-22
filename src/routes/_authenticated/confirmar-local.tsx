import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PillButton } from "@/components/foodie/PillButton";
import { LocationPicker } from "@/components/map";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useSelectedAddress } from "@/hooks/use-selected-address";
import { supabase } from "@/integrations/supabase/client";
import type { LatLng } from "@/lib/geo";
import { useLocationStore } from "@/stores/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/confirmar-local")({
  validateSearch: (s: Record<string, unknown>) => ({
    voltar: s.voltar === "/cesta" ? ("/cesta" as const) : ("/inicio" as const),
  }),
  head: () => ({
    meta: [
      { title: "Confirmar local | Foodie" },
      { name: "description", content: "Escolha no mapa onde você quer receber seu pedido." },
      { property: "og:title", content: "Confirmar local | Foodie" },
      { property: "og:description", content: "Escolha no mapa onde você quer receber seu pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfirmLocationPage,
});

const DEFAULT_CENTER: LatLng = [-23.5614, -46.6559]; // Av. Paulista, São Paulo
const LABELS = ["Casa", "Trabalho", "Outro"] as const;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

function formatAddress(r: { display_name: string; address?: Record<string, string> }) {
  const a = r.address ?? {};
  const street = [a.road ?? a.pedestrian ?? a.footway, a.house_number].filter(Boolean).join(", ");
  const line1 = street || r.display_name.split(",").slice(0, 2).join(",");
  const line2 = [a.suburb ?? a.neighbourhood, a.city ?? a.town ?? a.municipality].filter(Boolean).join(" - ");
  return { line1, line2 };
}

function ConfirmLocationPage() {
  const user = useAuthUser();
  const { voltar } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { address: current } = useSelectedAddress(user.id);
  const setSelected = useLocationStore((s) => s.setSelectedAddressId);
  const [initial] = useState<LatLng>(() => (current ? [current.lat, current.lng] : DEFAULT_CENTER));
  const [center, setCenter] = useState<LatLng>(initial);
  const [target, setTarget] = useState<LatLng | null>(null);
  const [resolved, setResolved] = useState<{ line1: string; line2: string } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [label, setLabel] = useState<(typeof LABELS)[number]>("Casa");
  const [complement, setComplement] = useState("");
  const [saving, setSaving] = useState(false);
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reverse geocode the pin position.
  useEffect(() => {
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
    setResolving(true);
    reverseTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${center[0]}&lon=${center[1]}&zoom=18&addressdetails=1&accept-language=pt-BR`,
        );
        if (!res.ok) throw new Error();
        const json = (await res.json()) as NominatimResult;
        setResolved(formatAddress(json));
      } catch {
        setResolved({ line1: `Local selecionado (${center[0].toFixed(5)}, ${center[1].toFixed(5)})`, line2: "" });
      } finally {
        setResolving(false);
      }
    }, 600);
    return () => {
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
    };
  }, [center]);

  // Address search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=br&limit=5&addressdetails=1&accept-language=pt-BR`,
        );
        setResults(res.ok ? ((await res.json()) as NominatimResult[]) : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  const locate = () => {
    if (!navigator.geolocation) return toast.error("Seu navegador não permite localização.");
    navigator.geolocation.getCurrentPosition(
      (p) => setTarget([p.coords.latitude, p.coords.longitude]),
      () => toast.error("Não conseguimos acessar sua localização."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const confirm = async () => {
    if (!resolved) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        label,
        line1: resolved.line1.slice(0, 200),
        line2: [complement.trim(), resolved.line2].filter(Boolean).join(" · ").slice(0, 200) || null,
        lat: center[0],
        lng: center[1],
      })
      .select("id")
      .single();
    setSaving(false);
    if (error || !data) return toast.error("Não foi possível salvar o endereço.");
    setSelected(data.id);
    await qc.invalidateQueries({ queryKey: ["addresses", user.id] });
    toast.success("Endereço confirmado!");
    navigate({ to: voltar, replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/60">
      <div className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden bg-background">
        <LocationPicker initialCenter={initial} target={target} onCenterChange={setCenter} className="absolute inset-0" />

        {/* Top search */}
        <div className="absolute inset-x-0 top-0 z-[600] px-4 pt-[calc(env(safe-area-inset-top)+14px)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Voltar"
              onClick={() => navigate({ to: voltar })}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card shadow-soft"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-card px-4 shadow-soft">
              {searching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar endereço ou local"
                aria-label="Buscar endereço"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button type="button" aria-label="Limpar" onClick={() => setQuery("")}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </label>
          </div>
          {results.length > 0 && (
            <ul className="mt-2 overflow-hidden rounded-2xl bg-card shadow-soft animate-fade-up">
              {results.map((r) => {
                const f = formatAddress(r);
                return (
                  <li key={r.place_id}>
                    <button
                      type="button"
                      onClick={() => {
                        setTarget([Number(r.lat), Number(r.lon)]);
                        setQuery("");
                        setResults([]);
                      }}
                      className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{f.line1}</span>
                        <span className="block truncate text-xs text-muted-foreground">{f.line2 || r.display_name}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {query.trim().length >= 3 && !searching && results.length === 0 && (
            <p className="mt-2 rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-soft">Nenhum endereço encontrado.</p>
          )}
        </div>

        <button
          type="button"
          onClick={locate}
          aria-label="Usar minha localização"
          className="absolute bottom-[300px] right-4 z-[600] flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary-deep shadow-soft"
        >
          <LocateFixed className="h-5 w-5" />
        </button>

        {/* Bottom card */}
        <div className="absolute inset-x-0 bottom-0 z-[600] rounded-t-[28px] bg-card px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-5 shadow-float animate-fade-up">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              {resolving || !resolved ? (
                <div className="space-y-1.5 pt-1">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <>
                  <p className="truncate text-sm font-bold">{resolved.line1}</p>
                  <p className="truncate text-xs text-muted-foreground">{resolved.line2 || "Arraste o mapa para ajustar"}</p>
                </>
              )}
            </div>
          </div>
          <input
            value={complement}
            onChange={(e) => setComplement(e.target.value.slice(0, 80))}
            placeholder="Complemento (apto, bloco, referência)"
            aria-label="Complemento"
            className="mt-4 h-11 w-full rounded-full bg-input px-4 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="mt-3 flex gap-2">
            {LABELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLabel(l)}
                aria-pressed={label === l}
                className={cn(
                  "h-9 flex-1 rounded-full border text-xs font-semibold transition",
                  label === l ? "border-primary bg-primary-soft text-primary-deep" : "border-border text-muted-foreground",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <PillButton className="mt-4 w-full" loading={saving} disabled={resolving || !resolved} onClick={confirm}>
            Confirmar local
          </PillButton>
        </div>
      </div>
    </div>
  );
}

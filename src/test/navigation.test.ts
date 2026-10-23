import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "@/components/foodup/BottomNav";
import { routeTree } from "@/routeTree.gen";

describe("Bottom navigation", () => {
  it("shows exactly Início, Busca, Pedidos and Perfil, in that order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["Início", "Busca", "Pedidos", "Perfil"]);
  });

  it("every tab points to an existing page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const { to } of NAV_ITEMS) {
      expect(router.matchRoutes(to).at(-1)?.routeId, to).not.toBe(rootRouteId);
    }
  });
});

import { useQuery } from "@tanstack/react-query";
import { addressesQuery } from "@/lib/queries";
import { useLocationStore } from "@/stores/cart";

/** The address chosen for delivery, falling back to the most recent one. */
export function useSelectedAddress(userId: string) {
  const q = useQuery(addressesQuery(userId));
  const selectedId = useLocationStore((s) => s.selectedAddressId);
  const list = q.data ?? [];
  const address = list.find((a) => a.id === selectedId) ?? list[0] ?? null;
  return { ...q, address };
}

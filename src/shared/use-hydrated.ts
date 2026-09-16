import {useSyncExternalStore} from "react";

const emptySubscribe = () => () => {};

/** False during SSR/hydration, true after the client snapshot is used. */
export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

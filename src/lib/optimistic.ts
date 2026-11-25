import type { QueryClient, QueryKey } from '@tanstack/react-query'

// Optimista cache-frissítés: azonnal átírja a cache-t, és visszaad egy visszaállító függvényt hibára.
export async function patchCache<T>(qc: QueryClient, key: QueryKey, fn: (old: T) => T) {
  await qc.cancelQueries({ queryKey: key })
  const prev = qc.getQueryData<T>(key)
  if (prev !== undefined) qc.setQueryData<T>(key, fn(prev))
  return () => qc.setQueryData(key, prev)
}

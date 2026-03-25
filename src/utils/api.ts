import { useAuthStore } from '@/store/auth'

export type ApiOk<T> = { success: true } & T
export type ApiErr = { success: false; error: string }

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown; auth?: boolean },
): Promise<ApiOk<T>> {
  const auth = init?.auth !== false
  const token = auth ? useAuthStore.getState().accessToken : null

  const headers = new Headers(init?.headers)
  headers.set('accept', 'application/json')
  if (init?.json !== undefined) headers.set('content-type', 'application/json')
  if (token) headers.set('authorization', `Bearer ${token}`)

  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  })

  const json = (await res.json().catch(() => null)) as ApiOk<T> | ApiErr | null

  if (!res.ok || !json || (json as ApiErr).success === false) {
    const message = (json as ApiErr | null)?.error || `Request failed (${res.status})`
    if (res.status === 401) {
      useAuthStore.getState().clear()
    }
    throw new Error(message)
  }

  return json as ApiOk<T>
}

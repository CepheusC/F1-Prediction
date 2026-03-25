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

  const controller = new AbortController()
  const timeoutMs = 15000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers,
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
      signal: controller.signal,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error'
    const isAbort = e instanceof DOMException && e.name === 'AbortError'
    throw new Error(isAbort ? `请求超时（>${timeoutMs / 1000}s）` : msg)
  } finally {
    clearTimeout(timeout)
  }

  const resClone = res.clone()
  const json = (await res.json().catch(() => null)) as ApiOk<T> | ApiErr | null
  const text = json ? null : await resClone.text().catch(() => null)

  if (!res.ok || !json || (json as ApiErr).success === false) {
    const message =
      (json as ApiErr | null)?.error ||
      (text ? `Request failed (${res.status}): ${text.slice(0, 160)}` : `Request failed (${res.status})`)
    if (res.status === 401) {
      useAuthStore.getState().clear()
    }
    throw new Error(message)
  }

  return json as ApiOk<T>
}

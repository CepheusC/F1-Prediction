export function toIsoFromLocalInput(value: string) {
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) throw new Error('Invalid datetime')
  return dt.toISOString()
}

export function toLocalInputFromIso(iso: string) {
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return ''

  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = dt.getFullYear()
  const mm = pad(dt.getMonth() + 1)
  const dd = pad(dt.getDate())
  const hh = pad(dt.getHours())
  const mi = pad(dt.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}


export function ok<T>(data: T) {
  return { ok: true, data };
}

export function fail(message: string) {
  return { ok: false, message };
}

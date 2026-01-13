const limites = new Map<
  string,
  { count: number; resetAt: number }
>();

const WINDOW_MS = 60_000; // 1 minuto
const MAX_REQUESTS = 20; // por usuário

export function rateLimitIA(usuarioId: string) {
  const agora = Date.now();
  const registro = limites.get(usuarioId);

  if (!registro || agora > registro.resetAt) {
    limites.set(usuarioId, {
      count: 1,
      resetAt: agora + WINDOW_MS
    });
    return true;
  }

  if (registro.count >= MAX_REQUESTS) {
    return false;
  }

  registro.count++;
  return true;
}

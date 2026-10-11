// PLANTILLA de la skill onboarding-cliente (Fase 5b).
// Copiar a src/lib/ del repo del cliente y reemplazar <CLIENTE> y <dominio.cl>.
// Los tres archivos van juntos: correo-lead.ts (servidor), aviso-lead.ts (navegador)
// y env.ts (las vars del Worker, que NO llegan por el parametro `env`).
/**
 * El `env` del Worker: las vars de `vite.config.ts` y los secrets puestos con
 * `wrangler secret put`.
 *
 * 🔴 **El `env` que recibe el `fetch` de `src/server.ts` viene VACÍO.** Ese handler es el
 * server entry de TanStack Start y lo llama h3 desde adentro del pipeline de Nitro, que
 * no le pasa el env de Cloudflare: leerlo de ahí da
 * `Cannot read properties of undefined`. Medido con `wrangler dev --local` antes de
 * desplegar, no después.
 *
 * Lo que sí está es `globalThis.__env__`, que el preset `cloudflare-module` de Nitro
 * asigna al entrar cada request, antes de cualquier hook.
 *
 * A diferencia del `getEnv()` de los otros sitios de la flota, este NO importa
 * `getRequest()` de `@tanstack/react-start/server`: un import de TanStack a nivel de
 * módulo en el chunk del servidor es justo lo que dejó a Constructora S&S y a Devoltych
 * en 500. Acá no hace falta — nunca corremos dentro de un `createServerFn`.
 *
 * Devuelve `{}` en vez de lanzar: quien avisa por correo no puede tumbar la página.
 */

export function leerEntorno(env?: unknown): Record<string, unknown> {
  const global = (globalThis as { __env__?: Record<string, unknown> }).__env__;
  if (global && typeof global === "object") return global;
  if (env && typeof env === "object") return env as Record<string, unknown>;
  return {};
}

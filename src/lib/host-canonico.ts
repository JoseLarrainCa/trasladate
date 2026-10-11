import { brand } from "./brand.generated";

/**
 * Un solo host canónico. Módulo puro: entra una URL, sale a dónde hay que
 * mandarla, o `null` si ya está donde corresponde.
 *
 * POR QUÉ EXISTE. `<dominio>.cl` y `www.<dominio>.cl` son, para Google, dos sitios
 * distintos con el mismo contenido. Si los dos contestan 200, la autoridad de
 * los enlaces se parte en dos y Google elige por su cuenta cuál mostrar. La
 * etiqueta `canonical` ayuda, pero es una sugerencia; un 301 es una instrucción.
 * Por eso el `www` redirige en vez de servir.
 *
 * Esto vive en la app y no en una Redirect Rule del panel de Cloudflare a
 * propósito: así viaja con el repo, se puede leer, y no depende de que alguien
 * se acuerde de recrear una regla en un dashboard.
 *
 * Qué NO redirige, y es deliberado: el `.workers.dev`. Ese es el URL de
 * respaldo, el que quedó anotado en la ficha del Hub y el que conoce el cliente.
 * Si el dominio propio se cayera, mandarlo ahí con un 301 dejaría al negocio sin
 * ninguna dirección viva. Para el buscador, ese host lo resuelve la etiqueta
 * `canonical`, que en todas las páginas apunta a `<dominio>.cl`.
 */

/** El 301 es permanente: le dice al buscador que mueva la autoridad, no que mire. */
const CODIGO = 301;

function hostsARedirigir(): string[] {
  return (brand.redirigirHosts ?? []).map((h) => h.toLowerCase());
}

function hostCanonico(): string {
  try {
    return new URL(brand.dominioCanonico).host.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * A dónde mandar esta petición, o `null` si se sirve tal cual.
 *
 * Dos casos, y ninguno toca el `.workers.dev` ni el localhost del desarrollo:
 *
 *   1. **Host equivocado** — `www.<dominio>.cl` se va al apex.
 *   2. **Sin cifrar** — `http://<dominio>.cl` se va a `https://`. Esto lo haría
 *      "Always Use HTTPS" del panel de Cloudflare, pero el token de wrangler no
 *      puede prender settings de zona, y un pendiente de dashboard se olvida: en
 *      MotoWord llevaba meses sin hacerse. Acá viaja con el repo.
 *
 * Conserva ruta, query y hash: un enlace a `www.<dominio>.cl/?utm_source=x` tiene
 * que llegar a la misma página con la misma etiqueta de campaña, o se pierde de
 * dónde vino la visita.
 */
export function destinoCanonico(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  const host = u.host.toLowerCase();
  const canonico = hostCanonico();
  if (!canonico) return null;

  const esOtroHost = hostsARedirigir().includes(host);
  const esCanonicoSinCifrar = host === canonico && u.protocol === "http:";
  if (!esOtroHost && !esCanonicoSinCifrar) return null;

  u.host = canonico;
  u.protocol = "https:";
  // El puerto viaja pegado a `host`; si el original traía uno, se limpia.
  u.port = "";
  return u.toString();
}

/** La respuesta 301, o `null` si esta petición no se redirige. */
export function respuestaCanonica(request: Request): Response | null {
  const destino = destinoCanonico(request.url);
  if (!destino) return null;

  return new Response(null, {
    status: CODIGO,
    headers: {
      location: destino,
      // Sin esto, una CDN podría guardar la redirección de una ruta y servirla
      // para otra.
      "cache-control": "public, max-age=3600",
    },
  });
}

# Trasladarte — operación

Marco Aguilar, mudanzas (Santiago). Página + cotizador público + panel de cotizaciones en PDF.
Repo `JoseLarrainCa/trasladate` (cuenta personal de José), disco `~/dev/trasladarte-app`.

## ⏩ Retomar aquí (2026-10-11)

- Migrado de Lovable + Supabase (Lovable Cloud, proyecto `fxapvspjhpnycpxldfwk`) a Cloudflare
  Worker + D1, en la rama `eject/cloudflare`. **Todavía NO está en el dominio**: vive en
  https://trasladarte.omnis-apps.workers.dev con `noindex`. trasladarte.com sigue sirviendo Lovable.
- Probado en vivo sobre workers.dev: portada, cotizador público (guarda en D1 + leads-flota + aviso
  `delivered` en Resend), login, dashboard, formularios, detalle (estado y notas), cotización PDF
  (guardar sube el folio), configuración (perfil, tarifas, contraseña) y video con 206.
- Hay UNA cotización de prueba ("Prueba Omnis QA Migracion") y un PDF folio 3286 de prueba en la D1.
  Se borran al importar los datos reales.

## Falta, en orden

1. **Datos reales.** José pide a Lovable el export en Excel de las 7 tablas (`quotes`, `quote_items`,
   `quote_documents`, `quote_settings`, `web_service_texts`, `profiles`, `user_roles`) con el conteo
   por tabla. Se cargan por partes (un archivo grande da `D1_RESET_DO`) conservando los ids.
   Hasta entonces el panel nuevo está vacío y Marco sigue en el de Lovable.
2. **Usuario de Marco.** Las claves de Supabase no se migran:
   `CLAVE_USUARIO='…' npx vite-node scripts/crear-usuario.mts -- <correo> --remote`.
   Hoy solo entra `jose@try-omnis.cl`.
3. **Aviso por correo.** El cotizador avisa por Resend a `jose@try-omnis.cl` (secret `MAIL_TO` para
   sumar la casilla de Marco) y además sigue mandando por **Formspree** (`mkoygbva`), que es lo que
   le llega hoy a Marco. No se sabe a qué casilla entrega Formspree: confirmarlo antes de apagarlo.
4. **Dominio** (ver abajo). Recién después de 1 y 2.

## Dominio: cómo está y cómo se cambia

- `trasladarte.com` (principal) y `trasladarte.cl` (redirige al .com) tienen sus DNS en el hosting de
  Marco (nameservers `ns1/ns2/ns3.miwebdns.net`, cPanel en `186.64.119.15:2083`, Zone Editor).
- **El correo de Marco vive en ese hosting**: `MX trasladarte.com → mail.trasladarte.com`,
  `mail.trasladarte.com A 186.64.119.15` (arreglado el 2026-10-06; la casilla real es
  `administracion@trasladarte.com`). El `.cl` tiene `mail.trasladarte.cl`.
- Registros A actuales de la web (vuelta atrás): `trasladarte.com A 185.158.133.1` y
  `trasladarte.cl A 185.158.133.1` (Lovable), `www` CNAME al dominio.
- Receta (la misma de Pinturas Las Américas, 2026-10-08):
  1. Crear las zonas `trasladarte.com` y `trasladarte.cl` en la cuenta Omnis de Cloudflare y copiar
     TODOS los registros de la zona del cPanel (MX, `mail`, `cpanel`, `webmail`, SPF, DKIM), con
     `mail`/`cpanel`/`webmail` en gris (sin proxy).
  2. Cambiar los nameservers: el `.cl` en nic.cl, el `.com` en su registrador (por averiguar).
     Ese paso lo hace José o Marco con sus claves.
  3. Con la zona `active`: agregar `[[routes]]` con `custom_domain = true` para los cuatro hosts,
     desplegar, medir con `curl` + cache-buster y cerrar con `npm run flota:dominios -- trasladarte.com`.
  4. El cPanel sigue entrando por `https://186.64.119.15:2083` aunque el dominio ya no apunte ahí.

## Cómo se trabaja

- `npm test` (interfaz + Worker), `npm run typecheck:worker`, `npx tsc --noEmit -p tsconfig.app.json`.
- Deploy: `CLOUDFLARE_ACCOUNT_ID=4348d418d61283075685bc8bd4caeaae npm run cf:deploy`.
- D1 `trasladarte` (`9b915837-4ac5-4f44-8a8d-79291333af77`); leads en la base compartida `leads-flota`.
- Secrets del Worker: `SESSION_SECRET`, `RESEND_API_KEY` (y `MAIL_TO` cuando haya casilla de Marco).
- `marca:check` y `formularios:check` corren en `prebuild`.

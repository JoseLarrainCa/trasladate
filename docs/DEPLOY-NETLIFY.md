# Despliegue de Trasladate en Netlify

Guía para conectar el proyecto con Netlify y entregar el sitio al cliente.

---

## Requisitos previos

1. **Repositorio en GitHub** – El proyecto debe estar subido (ya lo tenés).
2. **Supabase** – Un proyecto Supabase con la base de datos configurada.
3. **Cuenta en Netlify** – [netlify.com](https://netlify.com) (plan gratuito es suficiente).

---

## Paso 1: Crear el sitio en Netlify

1. Entrá a [app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. **Connect to Git provider** → **GitHub**
4. Autorizá Netlify si te lo pide
5. Buscá el repositorio **Trasladate** y seleccionalo

---

## Paso 2: Configurar el build

Netlify usa el `netlify.toml` del repo. Debería detectar:

| Campo | Valor |
|-------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |

No hace falta cambiar nada si el archivo está en el repo.

---

## Paso 3: Variables de entorno (Supabase)

1. En Netlify: **Site configuration** → **Environment variables**
2. **Add a variable** → **Add single variable**
3. Agregá estas dos variables:

| Variable | Valor | Scopes |
|----------|-------|--------|
| `VITE_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | All |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (anon key de Supabase) | All |

En Supabase: **Project Settings** → **API** para ver la URL y la anon key.

---

## Paso 4: Desplegar

1. **Deploy site** (o **Trigger deploy** si ya creaste el sitio)
2. Esperá 1–2 minutos
3. El sitio quedará en una URL tipo: `https://random-name-123.netlify.app`

---

## Paso 5: Dominio personalizado (opcional)

1. **Domain management** → **Add custom domain**
2. Seguí las instrucciones para apuntar el DNS al sitio de Netlify

---

## Resumen rápido

```
GitHub (Trasladate) → Netlify (import) → Variables Supabase → Deploy
```

Si algo falla, revisá los logs en **Deploys** → **Deploy log**.

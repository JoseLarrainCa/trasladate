# Plan de Resolución: Error 401 al Subir Cotización

## 1. Diagnóstico del Error

### Error reportado
```
ntnsgbpvamxeglsdwfaa.supabase.co/rest/v1/quotes?select=*: Failed to load resource: 401 ()
QuoteForm.tsx:207 Error submitting quote: Object
```

### Causa raíz identificada

El **401 Unauthorized** indica que Supabase está rechazando la operación. Las causas más probables:

| # | Causa | Probabilidad | Verificación |
|---|-------|--------------|--------------|
| 1 | **Faltan GRANTs para rol `anon`** | Alta | El rol `anon` (usuarios no autenticados) necesita permisos explícitos en la tabla |
| 2 | **Políticas RLS sin `TO anon`** | Alta | Las políticas de INSERT deben especificar explícitamente `TO anon` |
| 3 | **INSERT + SELECT**: El `.select().single()` puede requerir SELECT | Media | PostgREST puede ejecutar SELECT después del INSERT para retornar el registro |
| 4 | **Esquema no ejecutado o incompleto** | Media | Las tablas/políticas podrían no existir o estar mal configuradas |
| 5 | **API Key inválida** | Baja | Si las variables de entorno están mal, fallaría todo |

---

## 2. Flujo del Error

```
Cliente (no autenticado) → Formulario → supabase.from('quotes').insert(data).select().single()
                                              ↓
                                    Request con anon key
                                              ↓
                                    Supabase / PostgREST
                                              ↓
                          ¿Tiene permiso INSERT? (GRANT + RLS)
                                              ↓
                                    Si INSERT OK → ¿Necesita SELECT para RETURNING?
                                              ↓
                                    401 si falta permiso
```

**Nota**: Al usar `.insert().select().single()`, PostgREST hace un INSERT con `Prefer: return=representation`. En algunos casos puede requerir que el rol tenga permiso SELECT para devolver el registro insertado.

---

## 3. Plan de Corrección

### Paso 1: Ejecutar SQL de corrección en Supabase

Crear y ejecutar el archivo `supabase-fix-permissions.sql` (ver abajo) en el SQL Editor de Supabase. Esto:

1. Otorga permisos explícitos al rol `anon` 
2. Asegura que las políticas incluyan `TO anon`
3. Da permiso SELECT a `anon` solo para el RETURNING del INSERT (alternativa: usar función con SECURITY DEFINER)

### Paso 2: Verificar en Supabase Dashboard

1. **Authentication > Policies**: Confirmar que existen las políticas para `quotes` y `quote_items`
2. **Table Editor > quotes**: Verificar que la tabla existe y tiene datos de prueba si aplica
3. **Project Settings > API**: Confirmar que la URL y anon key son correctas

### Paso 3: Mejorar manejo de errores en el frontend

Agregar logging más detallado del error de Supabase para futuros diagnósticos:

```typescript
// En QuoteForm.tsx - catch block
if (error) {
  console.error('Supabase error details:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}
```

### Paso 4 (alternativa): Evitar SELECT en el INSERT

Si el problema persiste después del SQL fix, puede ser que PostgREST requiera permiso SELECT para el RETURNING. En ese caso, hay dos opciones:

**Opción A** (no recomendada): Agregar `GRANT SELECT ON quotes TO anon` - expone las cotizaciones al público

**Opción B** (recomendada): Modificar el frontend para usar `.insert()` sin `.select()`:
- El INSERT seguirá guardando en Supabase
- Mostrar éxito con referencia temporal (ej: timestamp) en lugar del ID real

---

## 4. SQL de Corrección

El archivo **`supabase-fix-permissions.sql`** contiene las correcciones necesarias. Ejecutar en:
**Supabase Dashboard → SQL Editor → New query → Pegar → Run**

---

## 5. Orden de Ejecución

1. Ejecutar `supabase-fix-permissions.sql` en Supabase SQL Editor
2. Probar nuevamente el formulario
3. Si falla, revisar la consola del navegador para el mensaje de error completo
4. Verificar en Supabase Logs (Dashboard > Logs) el error exacto del backend

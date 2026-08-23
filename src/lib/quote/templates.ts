/**
 * Interpolación de plantillas del PDF.
 * Soporta {{variable}} y bloques condicionales {{#flag}}...{{/flag}} / {{^flag}}...{{/flag}}
 */

export type TplVars = Record<string, string | number | boolean | undefined>;

export function renderTemplate(tpl: string, vars: TplVars): string {
  if (!tpl) return '';
  let out = tpl;

  // Bloques condicionales
  out = out.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_m, key: string, body: string) =>
    vars[key] ? body : ''
  );
  out = out.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_m, key: string, body: string) =>
    vars[key] ? '' : body
  );

  // Variables
  out = out.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  });

  return out.replace(/\s{2,}/g, ' ').trim();
}

/** Devuelve el texto de una key: override de la cotización ?? default de empresa, interpolado. */
export function resolveTexto(
  key: string,
  overrides: Record<string, string>,
  defaults: Record<string, string>,
  vars: TplVars
): string {
  const raw = overrides[key] !== undefined ? overrides[key] : defaults[key];
  if (raw === undefined) return '';
  if (raw.trim() === '') return '';
  return renderTemplate(raw, vars);
}

/** Palabra con espacios entre letras: "TRASLADO" → "T R A S L A D O" */
export const espaciar = (s: string) =>
  s
    .split(' ')
    .map((w) => w.split('').join(' '))
    .join('   ');

/** Número de cuenta con espacios entre dígitos */
export const espaciarDigitos = (s: string) => s.split('').join(' ');

export const dosDigitos = (n: number) => String(n).padStart(2, '0');

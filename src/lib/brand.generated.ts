// GENERADO POR scripts/marca.mjs — NO EDITAR A MANO.
// Edita brand.config.json y corre: npm run marca

export type BrandConfig = {
  marcaVersion: string;
  nombre: string;
  descripcion: string;
  dominioCanonico: string;
  logoPath: string;
  colorMarca: string;
  rutasPublicas: string[];
  tagline?: string;
  rubro?: string;
  ciudad?: string;
  locale?: string;
  logoIncluyeNombre?: boolean;
  colorFondoOg?: string;
  ogLogoAlto?: number;
  urlRespaldo?: string;
  redirigirHosts?: string[];
  rutasExcluidas?: string[];
  omitir?: string[];
  icono?: { recorte?: number[]; margen?: number; fondo?: string };
  /**
   * Huella de brand.config.json + el logo, generada aca. Sirve para versionar la URL
   * de los iconos y de la tarjeta social: el navegador cachea el favicon con una
   * agresividad que no respeta el deploy, y Chrome lo guarda en una base propia que
   * sobrevive al recargado duro. Sin ?v=<hash> el logo nuevo no aparece nunca.
   */
  assetsHash?: string;
  negocio?: {
    direccion?: string;
    ciudad?: string;
    region?: string;
    codigoPostal?: string;
    pais?: string;
    telefono?: string;
    horario?: { dias: string[]; abre: string; cierra: string }[];
    instagram?: string;
    whatsapp?: string;
  };
};

export const brand: BrandConfig = {
  "marcaVersion": "1.0.0",
  "nombre": "Trasladarte",
  "descripcion": "Mudanzas de hogar, oficinas y traslados especiales en Santiago, con embalaje y cobertura de Arica a Punta Arenas. Cotiza tu mudanza en línea.",
  "dominioCanonico": "https://trasladarte.cl",
  "urlRespaldo": "https://trasladarte.omnis-apps.workers.dev",
  "redirigirHosts": [
    "www.trasladarte.com",
    "www.trasladarte.cl"
  ],
  "logoPath": "public/logo.png",
  "colorMarca": "#F2690D",
  "rutasPublicas": [
    "/"
  ],
  "tagline": "La gran aventura de mudarte",
  "rubro": "Mudanzas",
  "ciudad": "Santiago",
  "locale": "es-CL",
  "logoIncluyeNombre": true,
  "icono": {
    "recorte": [
      433,
      31,
      120,
      120
    ],
    "margen": 0.08,
    "fondo": "#FFFFFF"
  },
  "negocio": {
    "ciudad": "Santiago",
    "region": "Región Metropolitana",
    "pais": "CL",
    "telefono": "+56 9 9004 0399",
    "whatsapp": "+56 9 9004 0399"
  },
  "rutasExcluidas": [
    "/admin",
    "/login"
  ],
  "omitir": [],
  "ogLogoAlto": 0.55,
  "colorFondoOg": "#FFFFFF",
  "assetsHash": "1c1ad9402b82"
};

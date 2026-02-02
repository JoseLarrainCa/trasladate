# PRD: Sistema de Cotización y Gestión - Trasladate

## 1. Resumen Ejecutivo

### 1.1 Visión del Producto
Transformar el actual formulario de cotización (que solo envía por WhatsApp) en un sistema completo de gestión que permita:
- Capturar cotizaciones detalladas con inventario de muebles
- Persistir datos en base de datos (Supabase)
- Proporcionar un panel administrativo para ver cotizaciones y estadísticas
- Importar datos históricos desde Excel

### 1.2 Flujo Principal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTE (Público)                              │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────┐  │
│  │  PASO 1             │ →  │  PASO 2             │ →  │ Confirmación│  │
│  │  Datos Generales    │    │  Inventario Muebles │    │ (Guardado)  │  │
│  │  - Cliente          │    │  - Living           │    │             │  │
│  │  - Origen           │    │  - Cocina           │    │             │  │
│  │  - Destino          │    │  - Dormitorios      │    │             │  │
│  │  - Detalles         │    │  - etc.             │    │             │  │
│  └─────────────────────┘    └─────────────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ (Se guarda en Supabase)
┌─────────────────────────────────────────────────────────────────────────┐
│                        ADMINISTRADOR (Login requerido)                   │
│  ┌─────────────────────────────┐    ┌───────────────────────────────┐   │
│  │  DASHBOARD                  │    │  FORMULARIOS                  │   │
│  │  - Estadísticas             │    │  - Lista de cotizaciones      │   │
│  │  - Gráficos                 │    │  - Ver detalle (clic en fila) │   │
│  │  - Métricas                 │    │  - Cambiar estado             │   │
│  │                             │    │  - Agregar notas              │   │
│  └─────────────────────────────┘    └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Objetivos de Negocio
1. **Centralizar información**: Todas las cotizaciones en un solo lugar
2. **Eficiencia operativa**: Reducir trabajo manual de transcripción
3. **Visibilidad**: Ver cada cotización en detalle, exactamente como el cliente la envió
4. **Toma de decisiones**: Estadísticas y métricas para análisis
5. **Integración**: Preparar datos para software externo (futuro)

### 1.4 Usuarios Target
| Usuario | Descripción | Acceso |
|---------|-------------|--------|
| **Cliente** | Persona que solicita cotización de mudanza | Público (sin login) |
| **Administrador** | Personal de Trasladate que gestiona cotizaciones | Privado (con login) |

---

## 2. Alcance del Proyecto

### 2.1 En Alcance (MVP)
- [ ] Formulario de cotización en **2 pasos** (datos + inventario)
- [ ] Inventario completo de muebles por categoría
- [ ] Integración con Supabase (base de datos)
- [ ] Sistema de autenticación para administradores (/login)
- [ ] Panel admin con 2 secciones principales:
  - [ ] **Dashboard**: Estadísticas y métricas
  - [ ] **Formularios**: Lista de cotizaciones subidas, con detalle al hacer clic
- [ ] Cambio de estados y notas internas en cotizaciones
- [ ] Filtros y búsqueda de cotizaciones
- [ ] Importación de datos desde Excel

### 2.2 Fuera de Alcance (Fase 2+)
- Aplicación móvil nativa
- Integración automática con software externo (webhooks)
- Sistema de notificaciones push/email
- Cotización automática con precios
- Gestión de flotas y calendario de mudanzas
- Multi-tenancy (múltiples empresas)
- Exportar a PDF

---

## 3. Arquitectura Técnica

### 3.1 Stack Tecnológico
| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Frontend** | React + TypeScript + Vite | Ya existente en el proyecto |
| **UI Components** | shadcn/ui + Tailwind CSS | Ya configurado |
| **Animaciones** | Framer Motion | Ya implementado |
| **Backend/DB** | Supabase | BaaS con auth, DB, storage, APIs |
| **Auth** | Supabase Auth | Integrado, seguro, fácil de usar |
| **Routing** | React Router DOM | Ya instalado |

### 3.2 Estructura de la Aplicación

```
src/
├── components/
│   ├── ui/                    # shadcn components
│   ├── quote/                 # Formulario de cotización (2 pasos)
│   │   ├── QuoteForm.tsx      # Componente principal con stepper
│   │   ├── StepGeneralData.tsx    # Paso 1: Cliente + Origen + Destino + Detalles
│   │   ├── StepInventory.tsx      # Paso 2: Inventario de muebles
│   │   └── InventoryCategory.tsx  # Categoría de muebles (reutilizable)
│   └── admin/                 # Componentes del panel admin
│       ├── AdminLayout.tsx    # Layout con sidebar
│       ├── Sidebar.tsx        # Navegación lateral
│       ├── AdminHeader.tsx    # Header con usuario/logout
│       ├── StatCard.tsx       # Card de estadística
│       ├── QuotesTable.tsx    # Tabla de cotizaciones
│       ├── QuoteDetailView.tsx    # Vista detalle de cotización
│       ├── StatsCharts.tsx    # Gráficos de estadísticas
│       └── ExcelImporter.tsx  # Componente para importar Excel
├── pages/
│   ├── Index.tsx              # Landing page pública
│   ├── Login.tsx              # Página de login admin
│   ├── admin/
│   │   ├── Dashboard.tsx      # Estadísticas y métricas
│   │   ├── Formularios.tsx    # Lista de cotizaciones subidas
│   │   ├── FormularioDetalle.tsx  # Detalle de una cotización
│   │   ├── Importar.tsx       # Importar desde Excel
│   │   └── Configuracion.tsx  # Ajustes de cuenta
│   └── NotFound.tsx
├── lib/
│   ├── supabase.ts            # Cliente Supabase
│   ├── utils.ts
│   └── constants/
│       ├── inventory.ts       # Catálogo completo de muebles
│       ├── comunas.ts         # Lista de comunas
│       └── viviendas.ts       # Tipos de vivienda
├── hooks/
│   ├── useAuth.ts             # Hook de autenticación
│   ├── useQuotes.ts           # CRUD de cotizaciones
│   └── useStatistics.ts       # Métricas y estadísticas
├── types/
│   ├── database.ts            # Tipos generados de Supabase
│   ├── quote.ts               # Tipos de cotización
│   └── inventory.ts           # Tipos de inventario
└── contexts/
    └── AuthContext.tsx        # Contexto de autenticación
```

### 3.3 Modelo de Base de Datos (Supabase)

#### Tabla: `profiles` (Usuarios admin)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `quotes` (Cotizaciones)
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Datos del cliente
  cliente_nombre TEXT NOT NULL,
  cliente_apellido TEXT,
  cliente_razon_social TEXT,
  telefono TEXT NOT NULL,
  celular TEXT,
  email TEXT,
  
  -- Origen
  origen_direccion TEXT NOT NULL,
  origen_comuna TEXT NOT NULL,
  origen_tipo_vivienda TEXT NOT NULL,
  origen_tiene_ascensor BOOLEAN DEFAULT FALSE,
  origen_piso INTEGER,
  
  -- Destino
  destino_direccion TEXT NOT NULL,
  destino_comuna TEXT NOT NULL,
  destino_tipo_vivienda TEXT NOT NULL,
  destino_tiene_ascensor BOOLEAN DEFAULT FALSE,
  destino_piso INTEGER,
  
  -- Detalles
  tipo_mudanza TEXT NOT NULL,
  fecha_traslado DATE,
  fecha_indefinida BOOLEAN DEFAULT FALSE,
  sugerencia_adicional TEXT,
  
  -- Metadatos
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'cotizado', 'confirmado', 'completado', 'cancelado')),
  notas_internas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Para datos importados de Excel
  imported_from_excel BOOLEAN DEFAULT FALSE,
  excel_import_date TIMESTAMPTZ
);
```

#### Tabla: `quote_items` (Muebles por cotización)
```sql
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,        -- ej: "living_sofa_3_cuerpos"
  item_name TEXT NOT NULL,       -- ej: "Sofá de 3 cuerpos"
  category TEXT NOT NULL,        -- ej: "LIVING"
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(quote_id, item_key)
);
```

#### Tabla: `inventory_catalog` (Catálogo maestro de muebles)
```sql
CREATE TABLE inventory_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Índices y RLS
```sql
-- Índices para búsqueda
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_estado ON quotes(estado);
CREATE INDEX idx_quotes_cliente ON quotes(cliente_nombre, cliente_apellido);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-- RLS (Row Level Security)
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas: Solo usuarios autenticados pueden leer/escribir
CREATE POLICY "Admin can do everything" ON quotes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can do everything" ON quote_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Para inserción pública (formulario)
CREATE POLICY "Anyone can insert quotes" ON quotes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert quote_items" ON quote_items
  FOR INSERT WITH CHECK (true);
```

---

## 4. Especificación Funcional

### 4.1 Módulo: Formulario de Cotización Público

#### 4.1.1 Flujo de Usuario (2 pasos simples)
```
[Inicio] → [Paso 1: Datos Generales] → [Paso 2: Inventario] → [Confirmación]
```

**Paso 1**: Todos los datos del cliente, origen, destino y detalles en una sola vista
**Paso 2**: Inventario completo de muebles

---

#### 4.1.2 Paso 1: Datos Generales (Vista única con secciones)

El usuario completa todo en una sola pantalla, organizada en secciones claras:

##### Sección A: Datos del Cliente
| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| Nombres / Razón Social | Text | Sí | Min 2 caracteres |
| Apellido(s) | Text | No | - |
| Teléfono | Tel | Sí | Formato chileno |
| Celular | Tel | No | Formato chileno |
| Correo electrónico | Email | No | Formato email válido |

##### Sección B: Punto de Origen
| Campo | Tipo | Requerido | Opciones |
|-------|------|-----------|----------|
| Dirección | Text | Sí | - |
| Comuna | Select/Text | Sí | Lista de comunas |
| Tipo de vivienda | Select | Sí | Departamento, Casa 1 piso, Casa 2+ pisos, Oficina, Bodega |
| Piso | Number | No | 1-50 |
| Ascensor en origen | Radio | Sí | Sí / No |

##### Sección C: Punto de Destino
| Campo | Tipo | Requerido | Opciones |
|-------|------|-----------|----------|
| Dirección | Text | Sí | - |
| Comuna | Select/Text | Sí | Lista de comunas |
| Tipo de vivienda | Select | Sí | Departamento, Casa 1 piso, Casa 2+ pisos, Oficina, Bodega |
| Piso | Number | No | 1-50 |
| Ascensor en destino | Radio | Sí | Sí / No |

##### Sección D: Detalles del Traslado
| Campo | Tipo | Requerido | Opciones/Validación |
|-------|------|-----------|---------------------|
| Fecha de traslado | Date | Condicional | dd/mm/aaaa |
| Aún no lo decido | Checkbox | No | Si marcado, fecha no requerida |
| Tipo de mudanza | Select | Sí | Mudanza del Hogar, Mudanza de Oficina, Traslado Especial |
| Sugerencia adicional | Textarea | No | Max 500 caracteres |

**Botón**: "Siguiente: Agregar Muebles →"

---

#### 4.1.3 Paso 2: Inventario de Muebles

**Categorías y Items:**

##### LIVING
| Item | Key |
|------|-----|
| Mesa de arrimo | living_mesa_arrimo |
| Sofá en L | living_sofa_l |
| Sofá de 3 cuerpos | living_sofa_3_cuerpos |
| Sofá de 2 cuerpos | living_sofa_2_cuerpos |
| Sofá de 1 cuerpo | living_sofa_1_cuerpo |
| Sitial | living_sitial |
| Futón | living_futon |
| Mesita de centro | living_mesita_centro |
| Mesita lateral | living_mesita_lateral |
| Poltrona | living_poltrona |
| Rack | living_rack |
| Centro de entretenimiento o buffet | living_centro_entretenimiento |
| Licorera | living_licorera |
| Bar | living_bar |
| Televisor 50" | living_tv_50 |
| Televisor 48" | living_tv_48 |
| Televisor 42" | living_tv_42 |
| Televisor 36" | living_tv_36 |
| Televisor 32" | living_tv_32 |
| Equipo de sonido | living_equipo_sonido |
| Cortinas | living_cortinas |
| Lámparas | living_lamparas |
| Alfombras | living_alfombras |
| Cuadros | living_cuadros |
| Mármol | living_marmol |
| Piano vertical | living_piano_vertical |
| Piano de cola | living_piano_cola |
| Espejos | living_espejos |

##### COCINA-COMEDOR
| Item | Key |
|------|-----|
| Mesa de comedor - madera | cocina_mesa_madera |
| Mesa de comedor - vidrio | cocina_mesa_vidrio |
| Sillas de comedor | cocina_sillas |
| Cocina | cocina_cocina |
| Lava-vajilla | cocina_lavavajilla |
| Microondas | cocina_microondas |
| Muebles de cocina | cocina_muebles |
| Refrigerador (01 Puerta) | cocina_refri_1_puerta |
| Refrigerador Side by Side (02 puertas) | cocina_refri_side_by_side |
| Freezer | cocina_freezer |

##### LOGGIA
| Item | Key |
|------|-----|
| Lavadoras | loggia_lavadora |
| Secadoras | loggia_secadora |

##### OFICINA
| Item | Key |
|------|-----|
| Kardex | oficina_kardex |
| Escritorio | oficina_escritorio |
| Sillas de escritorio | oficina_sillas |
| Computador | oficina_computador |
| Impresora | oficina_impresora |
| Librero | oficina_librero |

##### TERRAZA
| Item | Key |
|------|-----|
| Parrilla | terraza_parrilla |
| Sillón de mimbre 3 cuerpos | terraza_mimbre_3 |
| Sillón de mimbre 2 cuerpos | terraza_mimbre_2 |
| Sillón de mimbre 1 cuerpo | terraza_mimbre_1 |
| Mesa de mimbre | terraza_mesa_mimbre |
| Mesa de taca taca | terraza_taca_taca |
| Mesa de ping pong | terraza_ping_pong |

##### DORMITORIOS (General)
| Item | Key |
|------|-----|
| Cama 1 plaza | dormitorio_cama_1_plaza |
| Camarote | dormitorio_camarote |
| Cama nido | dormitorio_cama_nido |
| Cuna | dormitorio_cuna |
| Veladores | dormitorio_veladores |
| Cajoneras | dormitorio_cajoneras |
| Cómodas | dormitorio_comodas |
| Ropero | dormitorio_ropero |
| Baúl | dormitorio_baul |
| Espejos | dormitorio_espejos |
| Alfombras | dormitorio_alfombras |

##### DORMITORIOS (Camas grandes)
| Item | Key |
|------|-----|
| Cama King - Base Dividida | dormitorio_cama_king |
| Cama Queen - Base Dividida | dormitorio_cama_queen |
| Cama 2 plazas - Base Dividida | dormitorio_cama_2_plazas |
| Cama 1.5 plazas | dormitorio_cama_1_5_plazas |

##### BODEGA
| Item | Key |
|------|-----|
| Bicicletas | bodega_bicicletas |
| Cajas en bodega | bodega_cajas |
| Muebles | bodega_muebles |

##### OTROS
| Item | Key |
|------|-----|
| Otro 1 (campo libre) | otros_1 |
| Otro 2 (campo libre) | otros_2 |
| Otro 3 (campo libre) | otros_3 |

#### 4.1.4 Confirmación (después de enviar)
- Resumen de todos los datos ingresados
- Botón "Enviar Cotización"
- Al enviar:
  1. Guardar en Supabase
  2. (Opcional) Abrir WhatsApp con resumen
  3. Mostrar mensaje de éxito con número de referencia

---

### 4.2 Módulo: Autenticación

#### 4.2.1 Página de Login (`/login`)
- Email + Password
- Botón "Ingresar"
- Link "¿Olvidaste tu contraseña?" (opcional MVP)
- Redirección a `/admin` tras login exitoso

#### 4.2.2 Protección de Rutas
- Todas las rutas `/admin/*` requieren autenticación
- Redirección a `/login` si no autenticado
- Persistencia de sesión con Supabase Auth

#### 4.2.3 Roles (Fase 1: Básico)
- **admin**: Acceso completo a todas las funciones
- **viewer**: Solo lectura (futuro)

---

### 4.3 Módulo: Panel Administrativo

#### 4.3.1 Layout General
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  Trasladate Admin           [Usuario] [Logout]   │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│  Dashboard   │        [Contenido Principal]              │
│  Formularios │                                           │
│  Importar    │                                           │
│  Configuración│                                          │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

**Menú de navegación:**
| Sección | Ruta | Descripción |
|---------|------|-------------|
| **Dashboard** | `/admin` | Estadísticas y métricas generales |
| **Formularios** | `/admin/formularios` | Lista de cotizaciones subidas por clientes |
| **Importar** | `/admin/importar` | Subir datos desde Excel |
| **Configuración** | `/admin/configuracion` | Ajustes de cuenta |

---

#### 4.3.2 Dashboard - Estadísticas (`/admin`)

Esta sección muestra **métricas y estadísticas** del negocio.

**Cards de resumen:**
| Card | Dato |
|------|------|
| Cotizaciones este mes | Número total |
| Cotizaciones pendientes | Por atender |
| Cotizaciones completadas | Finalizadas |
| Mueble más solicitado | Ej: "Sofá de 3 cuerpos" |

**Gráficos:**
- Cotizaciones por mes (últimos 6 meses) - Líneas
- Top 10 muebles más pedidos - Barras horizontales
- Cotizaciones por tipo de mudanza - Torta
- Comunas más frecuentes - Barras

**Filtros:**
- Rango de fechas
- Tipo de mudanza

---

#### 4.3.3 Formularios - Lista de Cotizaciones (`/admin/formularios`)

Esta sección muestra **todas las cotizaciones** que los clientes han subido.
Cada vez que un cliente completa el formulario, aparece aquí.

**Vista de lista:**
```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 Buscar...                    [Filtros ▼]   [Exportar]       │
├─────────────────────────────────────────────────────────────────┤
│  #REF    │ Fecha      │ Cliente        │ Ruta           │ Estado│
│  001234  │ 01/02/2026 │ Juan Pérez     │ Stgo → Viña    │ 🟡    │
│  001233  │ 31/01/2026 │ María López    │ Prov → LC      │ 🟢    │
│  001232  │ 30/01/2026 │ Empresa ABC    │ Ñuñoa → Maipú  │ 🔴    │
│  ...     │            │                │                │       │
└─────────────────────────────────────────────────────────────────┘
```

**Al hacer clic en una fila** → Abre el detalle completo de esa cotización.

#### 4.3.4 Detalle de Formulario (`/admin/formularios/:id`)

**Filtros:**
| Filtro | Tipo | Opciones |
|--------|------|----------|
| Estado | Multi-select | Pendiente, Contactado, Cotizado, Confirmado, Completado, Cancelado |
| Fecha desde | Date | - |
| Fecha hasta | Date | - |
| Tipo mudanza | Select | Hogar, Oficina, Especial |
| Comuna origen | Select | Lista comunas |
| Comuna destino | Select | Lista comunas |
| Búsqueda | Text | Nombre, teléfono, email |

**Tabla de resultados:**
| Columna | Ordenable |
|---------|-----------|
| # Ref | Sí |
| Fecha | Sí |
| Cliente | Sí |
| Teléfono | No |
| Origen → Destino | No |
| Tipo | No |
| Estado | Sí |
| Acciones | No |

**Acciones por fila:**
- Ver detalle
- Cambiar estado
- Agregar nota
- Eliminar (con confirmación)

#### 4.3.4 Detalle de Formulario (`/admin/formularios/:id`)

Cuando el admin hace clic en una cotización, ve **exactamente lo mismo que el cliente subió**, organizado así:

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Volver a Formularios          Cotización #001234            │
│                                  Estado: [Pendiente ▼]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ DATOS DEL CLIENTE ─────────────────────────────────────┐   │
│  │ Nombre: Juan Pérez García                                │   │
│  │ Teléfono: +56 9 1234 5678  │  Celular: +56 9 8765 4321  │   │
│  │ Email: juan@email.com                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ ORIGEN ─────────────────┐  ┌─ DESTINO ──────────────────┐  │
│  │ Av. Providencia 1234     │  │ Los Leones 567             │  │
│  │ Providencia              │  │ Las Condes                 │  │
│  │ Departamento, Piso 8     │  │ Casa 2 pisos               │  │
│  │ Ascensor: Sí             │  │ Ascensor: No               │  │
│  └──────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
│  ┌─ DETALLES ──────────────────────────────────────────────┐   │
│  │ Tipo: Mudanza del Hogar                                  │   │
│  │ Fecha: 15/02/2026                                        │   │
│  │ Sugerencia: Tengo un piano de cola, requiere cuidado...  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ INVENTARIO DE MUEBLES ─────────────────────────────────┐   │
│  │                                                          │   │
│  │  LIVING                          DORMITORIOS            │   │
│  │  ├─ Sofá de 3 cuerpos: 1         ├─ Cama King: 1        │   │
│  │  ├─ Sofá de 2 cuerpos: 1         ├─ Veladores: 2        │   │
│  │  ├─ Mesita de centro: 1          ├─ Cómoda: 1           │   │
│  │  ├─ TV 50": 1                    └─ Ropero: 2           │   │
│  │  └─ Piano de cola: 1                                     │   │
│  │                                                          │   │
│  │  COCINA-COMEDOR                  BODEGA                  │   │
│  │  ├─ Mesa comedor madera: 1       ├─ Bicicletas: 2        │   │
│  │  ├─ Sillas: 6                    └─ Cajas: 15            │   │
│  │  └─ Refrigerador: 1                                      │   │
│  │                                                          │   │
│  │  Total: 35 items                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ NOTAS INTERNAS ────────────────────────────────────────┐   │
│  │ [Agregar nota...]                                        │   │
│  │ • 01/02 - Contactado por teléfono, cotizando...          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Enviar por WhatsApp]  [Exportar PDF]  [Eliminar]             │
└─────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Ver todos los datos exactamente como el cliente los ingresó
- Cambiar estado (Pendiente → Contactado → Cotizado → Confirmado → Completado)
- Agregar notas internas para seguimiento
- Enviar resumen por WhatsApp
- Eliminar cotización (con confirmación)

---

#### 4.3.5 Importar Excel (`/admin/importar`)

**Flujo:**
1. Subir archivo Excel (.xlsx, .xls)
2. Previsualización de datos detectados
3. Mapeo de columnas (si necesario)
4. Validación de datos
5. Confirmación e importación
6. Resumen: X registros importados, Y errores

**Validaciones:**
- Campos requeridos presentes
- Formatos de fecha válidos
- Teléfonos en formato válido
- Detección de duplicados

---

## 5. Diseño UI/UX

### 5.1 Principios de Diseño
1. **Consistencia**: Mantener el look & feel de la landing actual
2. **Claridad**: Formularios limpios y fáciles de entender
3. **Eficiencia**: Mínimo número de clics para tareas comunes
4. **Responsividad**: Funcional en desktop y móvil

### 5.2 Paleta de Colores (Existente)
- **Primary**: `hsl(24, 90%, 50%)` - Naranja
- **Secondary**: `hsl(215, 50%, 23%)` - Azul oscuro
- **Background**: `hsl(30, 20%, 98%)` - Crema claro
- **Foreground**: `hsl(220, 30%, 15%)` - Gris oscuro

### 5.3 Tipografía (Propuesta de mejora)
- **Títulos**: Inter (reemplaza Montserrat) - Más moderno y legible
- **Cuerpo**: Inter (unificado) - Consistencia

### 5.4 Componentes Nuevos Necesarios
- [ ] NumberInput (para cantidades de muebles)
- [ ] DataTable (con sorting, filtering, pagination)
- [ ] StatCard (para métricas del dashboard)
- [ ] FileUpload (para importar Excel)
- [ ] StatusBadge (para estados de cotización)
- [ ] DateRangePicker (para filtros)

---

## 6. Plan de Implementación

### 6.1 Fase 1: Fundamentos - Supabase y Auth (Prioridad Alta)
| # | Tarea |
|---|-------|
| 1.1 | Configurar proyecto Supabase (crear cuenta/proyecto) |
| 1.2 | Crear esquema de base de datos (quotes, quote_items, profiles) |
| 1.3 | Configurar RLS y políticas de seguridad |
| 1.4 | Instalar @supabase/supabase-js y configurar cliente |
| 1.5 | Implementar AuthContext y hook useAuth |
| 1.6 | Crear página de Login (/login) |
| 1.7 | Configurar rutas protegidas (/admin/*) |
| 1.8 | Crear usuario admin inicial |

### 6.2 Fase 2: Formulario de Cotización - 2 Pasos (Prioridad Alta)
| # | Tarea |
|---|-------|
| 2.1 | Crear constantes: catálogo de muebles (inventory.ts) |
| 2.2 | Crear constantes: comunas y tipos de vivienda |
| 2.3 | Refactorizar QuoteForm a 2 pasos |
| 2.4 | Paso 1: StepGeneralData (cliente + origen + destino + detalles) |
| 2.5 | Paso 2: StepInventory (todas las categorías de muebles) |
| 2.6 | Componente InventoryCategory (reutilizable por categoría) |
| 2.7 | Integrar guardado en Supabase (quotes + quote_items) |
| 2.8 | Mantener opción de abrir WhatsApp al finalizar |
| 2.9 | Página de confirmación con número de referencia |

### 6.3 Fase 3: Panel Admin - Layout y Formularios (Prioridad Alta)
| # | Tarea |
|---|-------|
| 3.1 | Crear AdminLayout con sidebar responsive |
| 3.2 | Implementar navegación: Dashboard, Formularios, Importar |
| 3.3 | Página Formularios: tabla de cotizaciones subidas |
| 3.4 | Filtros: búsqueda, estado, fecha, tipo de mudanza |
| 3.5 | Vista detalle: mostrar exactamente lo que el cliente subió |
| 3.6 | Funcionalidad: cambiar estado de cotización |
| 3.7 | Funcionalidad: agregar notas internas |
| 3.8 | Funcionalidad: eliminar cotización |

### 6.4 Fase 4: Dashboard - Estadísticas (Prioridad Alta)
| # | Tarea |
|---|-------|
| 4.1 | Página Dashboard con cards de resumen |
| 4.2 | Hook useStatistics para métricas |
| 4.3 | Gráfico: cotizaciones por mes (Recharts) |
| 4.4 | Gráfico: top 10 muebles más solicitados |
| 4.5 | Gráfico: cotizaciones por tipo de mudanza |
| 4.6 | Filtros por rango de fechas |

### 6.5 Fase 5: Importación Excel (Prioridad Media)
| # | Tarea |
|---|-------|
| 5.1 | Instalar librería xlsx |
| 5.2 | Crear página de importación |
| 5.3 | Componente de drag & drop para subir archivo |
| 5.4 | Parser de Excel a formato interno |
| 5.5 | UI de preview con datos detectados |
| 5.6 | Validación de datos requeridos |
| 5.7 | Importación batch a Supabase |
| 5.8 | Resumen: X importados, Y errores |

### 6.6 Fase 6: Pulido y UX (Prioridad Media)
| # | Tarea |
|---|-------|
| 6.1 | Loading states y skeletons |
| 6.2 | Manejo de errores (toasts, mensajes) |
| 6.3 | Animaciones de transición (Framer Motion) |
| 6.4 | Responsividad móvil del admin |
| 6.5 | Optimización de performance |

---

## 7. Dependencias Nuevas

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "xlsx": "^0.18.x"
  }
}
```

---

## 8. Variables de Entorno

```env
# .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx
```

---

## 9. Consideraciones de Seguridad

1. **RLS en Supabase**: Todas las tablas con Row Level Security
2. **Validación**: Frontend y backend (Supabase functions si necesario)
3. **HTTPS**: Obligatorio en producción
4. **Sanitización**: Inputs sanitizados antes de guardar
5. **Rate limiting**: Considerar para formulario público

---

## 10. Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Cotizaciones capturadas | 100% vs WhatsApp actual |
| Tiempo de respuesta | < 24 horas |
| Datos completos | > 90% con inventario |
| Uptime | > 99% |

---

## 11. Preguntas Abiertas

1. **Excel histórico**: ¿Estructura exacta de columnas del Excel a importar?
2. **Usuarios admin**: ¿Cuántos usuarios necesitan acceso? ¿Diferentes roles?
3. **Notificaciones**: ¿Email/notificación cuando llega nueva cotización?
4. **Software externo**: ¿API específica a integrar en el futuro?
5. **Multi-idioma**: ¿Solo español o preparar para otros idiomas?

---

## 12. Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.1 | 2026-02-01 | Formulario simplificado a 2 pasos. Dashboard y Formularios como secciones separadas. |
| 1.0 | 2026-02-01 | Documento inicial |

---

## 13. Aprobación

- [ ] Product Owner
- [ ] Tech Lead
- [ ] Stakeholders

---

*Documento generado para proyecto Trasladate - Sistema de Cotización y Gestión*

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer, Save, RefreshCw, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const OBSOLETE_KEYS = ['mod_item_equipo_detalle'];
import AdminLayout from '@/components/admin/AdminLayout';
import DocMarco from '@/components/admin/pdf/DocMarco';
import DocModerno from '@/components/admin/pdf/DocModerno';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NumeroInput from '@/components/admin/NumeroInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { db } from '@/integrations/db';
import { useToast } from '@/hooks/use-toast';
import { ALL_INVENTORY_ITEMS, getInventoryItem } from '@/lib/constants/inventory';
import {
  DEFAULT_SERVICIO_DETALLES,
  mergeServicioDetalles,
  type ServicioDetalles,
} from '@/lib/constants/services';
import {
  ACCION_KEYS,
  CAMIONES,
  DEFAULT_EMPRESA,
  DEFAULT_TARIFAS,
  DEFAULT_TEXTOS,
  MATERIALES_BODEGA,
  MATERIALES_DOMICILIO,
  ACCIONES_BODEGA,
  ACCIONES_DOMICILIO,
  OBSERVACION_KEYS,
  SALUDO_OPTIONS,
  SECCIONES_MODERNO,
  TEXTO_DEFS,
  TEXTO_VARIANTES,
  TIPO_SERVICIO_OPTIONS,
  TITULO_OPTIONS,
  type Empresa,
  type Tarifas,
} from '@/lib/quote/defaults';
import {
  calcularPrecio,
  formatCLP,
  m3ToBodegaM2,
  sugerirCamion,
  sugerirPersonas,
  totalItems,
  totalM3,
  type LineaInventario,
} from '@/lib/quote/pricing';
import { imprimirDocumento } from '@/lib/quote/print';
import type { DocConfig, DocState } from '@/lib/quote/document';
import { diasEmbalaje, personasEmbalaje } from '@/lib/quote/document';
import '@/styles/quote-pdf.css';

const hoy = () => new Date().toISOString().slice(0, 10);

const emptyDoc = (folio: number): DocState => ({
  folio,
  formato: 'marco',
  fecha_servicio: hoy(),
  titulo_servicio: TITULO_OPTIONS[0],
  saludo: SALUDO_OPTIONS[0],
  tipo_servicio: '',
  cliente: {
    nombre: '',
    razonSocial: '',
    email: '',
    telefono: '',
    origenDir: '',
    origenComuna: '',
    origenPiso: '',
    origenAscensor: true,
    origenTipo: 'departamento',
    destinoDir: '',
    destinoComuna: '',
    destinoPiso: '',
    destinoAscensor: true,
    destinoTipo: 'departamento',
  },
  camion: 'camion25',
  camion_qty: 1,
  personas: 3,
  con_embalaje: true,
  armado_camas: true,
  sin_iva: true,
  con_galeria: false,
  cuota1: 50,
  cuota2: 50,
  recargo_escala: 0,
  recargo_rampa: 0,
  recargo_estac: 0,
  recargo_otro: 0,
  precio_calculado: 0,
  precio_final: null,
  textos: {},
  materiales: [...MATERIALES_DOMICILIO],
  observaciones: [...OBSERVACION_KEYS],
  acciones: [...ACCION_KEYS],
  inventario: [],
});

/** Detecta el tipo de servicio guardado en la sugerencia adicional de la cotización web. */
const detectarTipoServicio = (sugerencia?: string | null): string => {
  if (!sugerencia) return '';
  const m = sugerencia.match(/Tipo de servicio:\s*(.+)/i);
  if (!m) return '';
  const t = m[1].toLowerCase();
  if (t.includes('express')) return 'express';
  if (t.includes('exclusivo')) return 'exclusivo';
  if (t.includes('principal')) return 'principal';
  return '';
};

const TIPOS = [
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa-1', label: 'Casa 1 piso' },
  { value: 'casa-2', label: 'Casa 2+ pisos' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'bodega', label: 'Bodega' },
];

const GenerarCotizacion = () => {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const docRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const [doc, setDoc] = useState<DocState>(emptyDoc(3286));
  const [cfg, setCfg] = useState<DocConfig>({
    empresa: DEFAULT_EMPRESA,
    tarifas: DEFAULT_TARIFAS,
    textosDefault: DEFAULT_TEXTOS,
  });
  const [nuevoItem, setNuevoItem] = useState('');
  const [zoom, setZoom] = useState(0.62);
  const [previewPages, setPreviewPages] = useState(0);
  const [paso, setPaso] = useState('general');
  const [editando, setEditando] = useState<{ seccion: string; keys: string[]; titulo: string } | null>(null);
  const [servicios, setServicios] = useState<ServicioDetalles>(DEFAULT_SERVICIO_DETALLES);

  useEffect(() => {
    const pages = docRef.current?.querySelectorAll<HTMLElement>('.m-page, .page');
    if (!pages) return;
    setPreviewPages(pages.length);
    pages.forEach((page, index) => {
      page.dataset.previewPage = `Página ${index + 1} de ${pages.length}`;
    });
  }, [doc, cfg, loading]);

  // Textos de servicio (editables en Configuración → Servicios web).
  useEffect(() => {
    db
      .from('web_service_texts')
      .select('servicios')
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.servicios) setServicios(mergeServicioDetalles(data.servicios));
      });
  }, []);

  /** Texto detallado del tipo de servicio (ej: Servicio Express con sus líneas). */
  const detalleDeServicio = (key: string): string => {
    const s = servicios[key as keyof ServicioDetalles];
    if (!s) return '';
    return [s.titulo, ...s.lineas.map((l) => `${l.label}: ${l.texto}`)].join('\n');
  };

  const elegirTipoServicio = (v: string) => {
    const tipo = v === 'none' ? '' : v;
    setDoc((d) => ({
      ...d,
      tipo_servicio: tipo,
      textos: { ...d.textos, detalle_servicio: tipo ? detalleDeServicio(tipo) : '' },
    }));
  };

  // Si el tipo de servicio ya venía detectado pero sin detalle, lo rellena al cargar los textos.
  useEffect(() => {
    setDoc((d) =>
      d.tipo_servicio && !(d.textos['detalle_servicio'] || '').trim()
        ? { ...d, textos: { ...d.textos, detalle_servicio: detalleDeServicio(d.tipo_servicio) } }
        : d
    );
  }, [servicios]);

  const set = useCallback(<K extends keyof DocState>(key: K, value: DocState[K]) => {
    setDoc((d) => ({ ...d, [key]: value }));
  }, []);
  const setCli = useCallback((patch: Partial<DocState['cliente']>) => {
    setDoc((d) => ({ ...d, cliente: { ...d.cliente, ...patch } }));
  }, []);

  /* ------------------------------ carga inicial ------------------------------ */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const sb = db;

      const [{ data: settings }, existing] = await Promise.all([
        sb.from('quote_settings').select('*').maybeSingle(),
        id
          ? sb.from('quote_documents').select('*').eq('quote_id', id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const conf: DocConfig = {
        empresa: { ...DEFAULT_EMPRESA, ...(settings?.empresa || {}) },
        tarifas: { ...DEFAULT_TARIFAS, ...(settings?.tarifas || {}) },
        textosDefault: { ...DEFAULT_TEXTOS, ...(settings?.textos || {}) },
      };
      setCfg(conf);

      const folioBase = settings?.siguiente_folio ?? 3286;
      let next = emptyDoc(folioBase);

      if (id) {
        const { data: q } = await sb.from('quotes').select('*').eq('id', id).maybeSingle();
        const { data: items } = await sb.from('quote_items').select('*').eq('quote_id', id);
        if (q) {
          next.quote_id = q.id;
          next.cliente = {
            nombre: [q.cliente_nombre, q.cliente_apellido].filter(Boolean).join(' '),
            razonSocial: q.cliente_razon_social || '',
            email: q.email || '',
            telefono: q.celular || q.telefono || '',
            origenDir: q.origen_direccion || '',
            origenComuna: q.origen_comuna || '',
            origenPiso: q.origen_piso || '',
            origenAscensor: !!q.origen_tiene_ascensor,
            origenTipo: q.origen_tipo_vivienda || 'departamento',
            destinoDir: q.destino_direccion || '',
            destinoComuna: q.destino_comuna || '',
            destinoPiso: q.destino_piso || '',
            destinoAscensor: !!q.destino_tiene_ascensor,
            destinoTipo: q.destino_tipo_vivienda || 'departamento',
          };
          if (q.fecha_traslado) next.fecha_servicio = String(q.fecha_traslado).slice(0, 10);
          next.tipo_servicio = detectarTipoServicio(q.sugerencia_adicional);
          if (next.tipo_servicio) next.textos.detalle_servicio = detalleDeServicio(next.tipo_servicio);
          // Presets según el destino (bodega vs casa/dpto): materiales y acciones
          const esBodega = next.cliente.destinoTipo === 'bodega';
          next.materiales = esBodega ? [...MATERIALES_BODEGA] : [...MATERIALES_DOMICILIO];
          next.acciones = esBodega ? [...ACCIONES_BODEGA] : [...ACCIONES_DOMICILIO];
        }
        next.inventario = (items || []).map((it: any) => ({
          item_key: it.item_key,
          name: it.item_name,
          qty: it.quantity,
          category: it.category,
          m3: getInventoryItem(it.item_key)?.m3 ?? 0,
        }));
      }

      if (existing?.data) {
        const d = existing.data;
        next = {
          ...next,
          id: d.id,
          folio: d.folio,
          formato: d.formato,
          fecha_servicio: d.fecha_servicio || next.fecha_servicio,
          titulo_servicio: d.titulo_servicio,
          saludo: d.saludo,
          tipo_servicio: d.tipo_servicio ?? next.tipo_servicio,
          cliente: { ...next.cliente, ...(d.cliente || {}) },
          camion: d.camion,
          camion_qty: d.camion_qty,
          personas: d.personas,
          con_embalaje: d.con_embalaje,
          armado_camas: d.armado_camas,
          sin_iva: d.sin_iva,
          con_galeria: d.con_galeria,
          cuota1: d.cuota1,
          cuota2: d.cuota2,
          recargo_escala: d.recargo_escala,
          recargo_rampa: d.recargo_rampa,
          recargo_estac: d.recargo_estac,
          recargo_otro: d.recargo_otro,
          precio_calculado: d.precio_calculado,
          precio_final: d.precio_final,
          textos: Object.fromEntries(
            Object.entries(d.textos || {}).filter(([k]) => !OBSOLETE_KEYS.includes(k))
          ) as Record<string, string>,
          materiales: d.materiales?.length ? d.materiales : next.materiales,
          observaciones: d.observaciones?.length ? d.observaciones : next.observaciones,
          acciones: d.acciones?.length ? d.acciones : next.acciones,
          inventario: d.inventario_override?.length ? d.inventario_override : next.inventario,
        };
        setDocId(d.id);
      } else {
        const m3 = totalM3(next.inventario);
        const sug = sugerirCamion(m3);
        next.camion = sug.camion;
        next.camion_qty = sug.cantidad;
        next.personas = sugerirPersonas(m3);
        if (params.get('formato') === 'moderno') next.formato = 'moderno';
      }

      setDoc(next);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ------------------------------- cálculos ------------------------------- */
  const m3 = useMemo(() => totalM3(doc.inventario), [doc.inventario]);
  const calc = useMemo(
    () =>
      calcularPrecio({
        m3,
        camion: doc.camion,
        camionQty: doc.camion_qty,
        personas: doc.personas,
        conEmbalaje: doc.con_embalaje,
        diasEmbalaje: diasEmbalaje(doc),
        personasEmbalaje: personasEmbalaje(doc),
        recargos: {
          escala: doc.recargo_escala,
          rampa: doc.recargo_rampa,
          estac: doc.recargo_estac,
          otro: doc.recargo_otro,
        },
        tarifas: cfg.tarifas,
      }),
    [m3, doc.camion, doc.camion_qty, doc.personas, doc.con_embalaje, doc.textos.dias_embalaje, doc.textos.personas_embalaje, doc.recargo_escala, doc.recargo_rampa, doc.recargo_estac, doc.recargo_otro, cfg.tarifas]
  );

  useEffect(() => {
    setDoc((d) => (d.precio_calculado === calc.precioCalculado ? d : { ...d, precio_calculado: calc.precioCalculado }));
  }, [calc.precioCalculado]);

  const resugerir = () => {
    const s = sugerirCamion(m3);
    setDoc((d) => ({ ...d, camion: s.camion, camion_qty: s.cantidad, personas: sugerirPersonas(m3) }));
  };

  /* ------------------------------ inventario ------------------------------ */
  const setQty = (key: string, qty: number) =>
    setDoc((d) => ({
      ...d,
      inventario: d.inventario.map((l) => (l.item_key === key ? { ...l, qty: Math.max(0, qty) } : l)),
    }));
  const quitar = (key: string) =>
    setDoc((d) => ({ ...d, inventario: d.inventario.filter((l) => l.item_key !== key) }));
  const agregar = () => {
    const item = getInventoryItem(nuevoItem);
    if (!item) return;
    setDoc((d) =>
      d.inventario.some((l) => l.item_key === item.key)
        ? { ...d, inventario: d.inventario.map((l) => (l.item_key === item.key ? { ...l, qty: l.qty + 1 } : l)) }
        : {
            ...d,
            inventario: [
              ...d.inventario,
              { item_key: item.key, name: item.name, qty: 1, m3: item.m3, category: item.category },
            ],
          }
    );
    setNuevoItem('');
  };

  /* --------------------------------- guardar -------------------------------- */
  const guardar = async () => {
    setSaving(true);
    const sb = db;
    const payload = {
      quote_id: doc.quote_id ?? id ?? null,
      folio: doc.folio,
      formato: doc.formato,
      fecha_servicio: doc.fecha_servicio || null,
      titulo_servicio: doc.titulo_servicio,
      saludo: doc.saludo,
      tipo_servicio: doc.tipo_servicio,
      cliente: doc.cliente,
      camion: doc.camion,
      camion_qty: doc.camion_qty,
      personas: doc.personas,
      con_embalaje: doc.con_embalaje,
      armado_camas: doc.armado_camas,
      sin_iva: doc.sin_iva,
      con_galeria: doc.con_galeria,
      cuota1: doc.cuota1,
      cuota2: doc.cuota2,
      recargo_escala: doc.recargo_escala,
      recargo_rampa: doc.recargo_rampa,
      recargo_estac: doc.recargo_estac,
      recargo_otro: doc.recargo_otro,
      precio_calculado: doc.precio_calculado,
      precio_final: doc.precio_final,
      textos: doc.textos,
      materiales: doc.materiales,
      observaciones: doc.observaciones,
      acciones: doc.acciones,
      inventario_override: doc.inventario,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (docId) {
      ({ error } = await sb.from('quote_documents').update(payload).eq('id', docId));
    } else {
      const res = await sb.from('quote_documents').insert(payload).select('id').single();
      error = res.error;
      if (res.data) setDocId(res.data.id);
      if (!res.error) {
        await sb
          .from('quote_settings')
          .update({ siguiente_folio: doc.folio + 1 })
          .neq('id', '00000000-0000-0000-0000-000000000000');
      }
    }

    setSaving(false);
    toast(
      error
        ? { title: 'Error al guardar', description: error.message, variant: 'destructive' }
        : { title: 'Cotización guardada', description: `Folio N° ${doc.folio}` }
    );
  };

  const toggleList = (field: 'materiales' | 'observaciones' | 'acciones', key: string) =>
    setDoc((d) => ({
      ...d,
      [field]: d[field].includes(key) ? d[field].filter((k) => k !== key) : [...d[field], key],
    }));

  const setTexto = (key: string, value: string) =>
    setDoc((d) => ({ ...d, textos: { ...d.textos, [key]: value } }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const grupos = ['Frases', 'Materiales', 'Acciones', 'Observaciones', 'Pago', 'Tabla', 'Moderno'] as const;

  const onPreviewClick = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest('[data-edit]') as HTMLElement | null;
    if (!el) return;
    const [seccion, ...keys] = (el.dataset.edit || '').split(',');
    setEditando({ seccion, keys, titulo: el.dataset.editLabel || 'Editar' });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Barra superior */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(id ? `/admin/formularios/${id}` : '/admin/formularios')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>
          <h1 className="text-xl font-heading font-bold text-foreground">
            Cotización N° {doc.folio}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={guardar} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar
            </Button>
            <Button size="sm" onClick={() => imprimirDocumento(docRef.current, `Cotizacion-${doc.folio}`)}>
              <Printer className="w-4 h-4 mr-1" /> Descargar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,420px)_1fr] gap-6">
          {/* -------------------------------- Editor -------------------------------- */}
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Completa los 3 pasos. Para cambiar cualquier texto, haz clic sobre él en la vista previa.
            </p>
            <Tabs value={paso} onValueChange={setPaso}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="general">1. Cliente y ruta</TabsTrigger>
                <TabsTrigger value="inventario">2. Inventario</TabsTrigger>
                <TabsTrigger value="servicio">3. Servicio y precio</TabsTrigger>
              </TabsList>

              {/* General */}
              <TabsContent value="general" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Formato</Label>
                    <Select value={doc.formato} onValueChange={(v) => set('formato', v as DocState['formato'])}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marco">Formato Marco (3 páginas)</SelectItem>
                        <SelectItem value="moderno">Formato Moderno (1 página)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>N° Servicio</Label>
                    <NumeroInput className="mt-1" value={doc.folio} vacioComo={0}
                      onCommit={(n) => set('folio', n)} />
                  </div>
                  <div>
                    <Label>Fecha de servicio</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={doc.fecha_servicio}
                      onChange={(e) => set('fecha_servicio', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Saludo</Label>
                    <Select value={doc.saludo} onValueChange={(v) => set('saludo', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SALUDO_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Título del servicio</Label>
                  <Input
                    className="mt-1"
                    list="titulos"
                    value={doc.titulo_servicio}
                    onChange={(e) => set('titulo_servicio', e.target.value.toUpperCase())}
                  />
                  <datalist id="titulos">
                    {TITULO_OPTIONS.map((t) => <option key={t} value={t} />)}
                  </datalist>
                </div>

                <div>
                  <Label>Tipo de servicio (se muestra en el PDF)</Label>
                  <Select
                    value={doc.tipo_servicio || 'none'}
                    onValueChange={elegirTipoServicio}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin indicar</SelectItem>
                      {TIPO_SERVICIO_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Al elegirlo, el detalle se rellena solo con la descripción del servicio.
                  </p>
                </div>

                <div>
                  <Label>Detalle del servicio (editable, sale bajo el título en ambos formatos)</Label>
                  <Textarea
                    className="mt-1"
                    rows={4}
                    placeholder="Ej: Traslado completo con embalaje de muebles grandes y armado en destino."
                    value={doc.textos['detalle_servicio'] ?? ''}
                    onChange={(e) => setTexto('detalle_servicio', e.target.value)}
                  />
                  {doc.tipo_servicio && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0 text-xs"
                      onClick={() => setTexto('detalle_servicio', detalleDeServicio(doc.tipo_servicio))}
                    >
                      Restaurar descripción original del servicio
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Frase de personal (fila 1)</Label>
                  <Textarea
                    rows={3}
                    value={doc.textos['personal_calificado'] ?? cfg.textosDefault['personal_calificado'] ?? ''}
                    onChange={(e) => setTexto('personal_calificado', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Déjala vacía para ocultarla del documento.</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto px-0 text-xs"
                    onClick={() =>
                      setDoc((d) => {
                        const { personal_calificado, ...rest } = d.textos;
                        return { ...d, textos: rest };
                      })
                    }
                  >
                    Restaurar frase original
                  </Button>
                </div>

                {doc.formato === 'moderno' && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-foreground">Contenido de las filas del formato Moderno</h3>

                    <div className="space-y-2">
                      <Label>Materiales — título</Label>
                      <Input
                        value={doc.textos['mod_item_materiales'] ?? cfg.textosDefault['mod_item_materiales'] ?? ''}
                        onChange={(e) => setTexto('mod_item_materiales', e.target.value)}
                      />
                      {TEXTO_DEFS.filter((t) => t.group === 'Materiales').map((t) => (
                        <div key={t.key} className="flex items-start gap-2">
                          <Checkbox
                            className="mt-2.5"
                            checked={doc.materiales.includes(t.key)}
                            onCheckedChange={() => toggleList('materiales', t.key)}
                          />
                          <Textarea
                            rows={2}
                            aria-label={t.label}
                            value={doc.textos[t.key] ?? cfg.textosDefault[t.key] ?? ''}
                            onChange={(e) => setTexto(t.key, e.target.value)}
                          />
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">
                        Marca los materiales que aparecerán y cambia cada frase directamente aquí.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Inventario — título</Label>
                      <Textarea
                        rows={2}
                        value={doc.textos['mod_item_inventario'] ?? cfg.textosDefault['mod_item_inventario'] ?? ''}
                        onChange={(e) => setTexto('mod_item_inventario', e.target.value)}
                      />
                      <Label>Inventario — texto inferior</Label>
                      <Textarea
                        rows={2}
                        value={doc.textos['mod_item_inventario_detalle'] ?? cfg.textosDefault['mod_item_inventario_detalle'] ?? ''}
                        onChange={(e) => setTexto('mod_item_inventario_detalle', e.target.value)}
                      />
                      <Label>Inventario — equivalencia de bodega</Label>
                      <Input
                        value={doc.textos['mod_item_bodega'] ?? cfg.textosDefault['mod_item_bodega'] ?? ''}
                        onChange={(e) => setTexto('mod_item_bodega', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Puedes usar las variables automáticas {'{{items}}'}, {'{{m3}}'} y {'{{m2}}'}.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Cliente</Label>
                    <Input className="mt-1" value={doc.cliente.nombre} onChange={(e) => setCli({ nombre: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label>Razón social (opcional)</Label>
                    <Input className="mt-1" value={doc.cliente.razonSocial} onChange={(e) => setCli({ razonSocial: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input className="mt-1" value={doc.cliente.email} onChange={(e) => setCli({ email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input className="mt-1" value={doc.cliente.telefono} onChange={(e) => setCli({ telefono: e.target.value })} />
                  </div>
                </div>

                {(['origen', 'destino'] as const).map((lado) => (
                  <div key={lado} className="rounded-xl border border-border p-3 space-y-3">
                    <div className="text-sm font-semibold uppercase text-muted-foreground">{lado}</div>
                    <Input
                      placeholder="Dirección"
                      value={lado === 'origen' ? doc.cliente.origenDir : doc.cliente.destinoDir}
                      onChange={(e) => setCli(lado === 'origen' ? { origenDir: e.target.value } : { destinoDir: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Comuna"
                        value={lado === 'origen' ? doc.cliente.origenComuna : doc.cliente.destinoComuna}
                        onChange={(e) => setCli(lado === 'origen' ? { origenComuna: e.target.value } : { destinoComuna: e.target.value })}
                      />
                      <Input
                        placeholder="Piso"
                        value={(lado === 'origen' ? doc.cliente.origenPiso : doc.cliente.destinoPiso) || ''}
                        onChange={(e) => setCli(lado === 'origen' ? { origenPiso: e.target.value } : { destinoPiso: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <Select
                        value={lado === 'origen' ? doc.cliente.origenTipo : doc.cliente.destinoTipo}
                        onValueChange={(v) => {
                          setCli(lado === 'origen' ? { origenTipo: v } : { destinoTipo: v });
                          // Al cambiar el destino, preseleccionar materiales y acciones típicas
                          if (lado === 'destino') {
                            setDoc((d) => ({
                              ...d,
                              materiales: v === 'bodega' ? [...MATERIALES_BODEGA] : [...MATERIALES_DOMICILIO],
                              acciones: v === 'bodega' ? [...ACCIONES_BODEGA] : [...ACCIONES_DOMICILIO],
                            }));
                          }
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={lado === 'origen' ? doc.cliente.origenAscensor : doc.cliente.destinoAscensor}
                          onCheckedChange={(v) => setCli(lado === 'origen' ? { origenAscensor: v } : { destinoAscensor: v })}
                        />
                        Ascensor
                      </label>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Servicio */}
              <TabsContent value="servicio" className="space-y-4 pt-4">
                <div className="rounded-xl bg-muted/50 p-3 text-sm flex items-center justify-between">
                  <span>
                    <b>{m3.toFixed(1)} m³</b> · {m3ToBodegaM2(m3).toFixed(1)} m² bodega · {totalItems(doc.inventario)} ítems
                  </span>
                  <Button variant="outline" size="sm" onClick={resugerir}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Sugerir
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label>Camión</Label>
                    <Select value={doc.camion} onValueChange={(v) => set('camion', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CAMIONES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cantidad</Label>
                    <NumeroInput min={1} className="mt-1" value={doc.camion_qty}
                      onCommit={(n) => set('camion_qty', n)} />
                  </div>
                  <div>
                    <Label>Personas</Label>
                    <NumeroInput min={1} className="mt-1" value={doc.personas}
                      onCommit={(n) => set('personas', n)} />
                  </div>
                </div>

                {doc.con_embalaje && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Días de embalaje antes de la mudanza</Label>
                      <Select value={String(diasEmbalaje(doc))}
                        onValueChange={(v) => setDoc((d) => ({ ...d, textos: { ...d.textos, dias_embalaje: v } }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Todo el mismo día</SelectItem>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n} día{n === 1 ? '' : 's'} antes</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-muted-foreground">Ej.: 1 día antes = embalan un día y mudan al siguiente.</p>
                    </div>
                    {diasEmbalaje(doc) > 0 && (
                      <div>
                        <Label>Personas que embalan cada día</Label>
                        <NumeroInput min={1} className="mt-1" value={personasEmbalaje(doc)}
                          onCommit={(n) => setDoc((d) => ({ ...d, textos: { ...d.textos, personas_embalaje: String(n) } }))} />
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['con_embalaje', 'Servicio de embalaje'],
                    ['armado_camas', 'Armado de camas'],
                    ['sin_iva', 'Nota "no incluye IVA"'],
                    ['con_galeria', 'Página de fotos'],
                  ] as const).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <Switch checked={doc[k] as boolean} onCheckedChange={(v) => set(k, v as never)} />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['recargo_escala', 'Recargo escala'],
                    ['recargo_rampa', 'Recargo rampa'],
                    ['recargo_estac', 'Recargo estacionamiento'],
                    ['recargo_otro', 'Otro recargo'],
                  ] as const).map(([k, label]) => (
                    <div key={k}>
                      <Label>{label}</Label>
                      <NumeroInput className="mt-1" value={doc[k] as number} vacioComo={0}
                        onCommit={(n) => set(k, n as never)} />
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border p-3 space-y-1 text-sm">
                  {calc.desglose.map((d) => (
                    <div key={d.label} className="flex justify-between text-muted-foreground">
                      <span>{d.label}</span><span>{formatCLP(d.valor)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-1 border-t border-border">
                    <span>Precio calculado</span><span>{formatCLP(calc.precioCalculado)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3">
                    <Label>Precio final (dejar vacío para usar el calculado)</Label>
                    <Input
                      type="number"
                      className="mt-1"
                      value={doc.precio_final ?? ''}
                      placeholder={String(calc.precioCalculado)}
                      onChange={(e) => set('precio_final', e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>% Cuota 1</Label>
                    <NumeroInput className="mt-1" value={doc.cuota1} vacioComo={0}
                      onCommit={(v) => setDoc((d) => ({ ...d, cuota1: v, cuota2: 100 - v }))} />
                  </div>
                  <div>
                    <Label>% Cuota 2</Label>
                    <Input type="number" className="mt-1" value={doc.cuota2} readOnly />
                  </div>
                </div>
              </TabsContent>

              {/* Inventario */}
              <TabsContent value="inventario" className="space-y-3 pt-4">
                <div className="flex gap-2">
                  <Select value={nuevoItem} onValueChange={setNuevoItem}>
                    <SelectTrigger><SelectValue placeholder="Agregar ítem…" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {ALL_INVENTORY_ITEMS.map((i) => (
                        <SelectItem key={i.key} value={i.key}>{i.name} — {i.category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={agregar} disabled={!nuevoItem}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
                  {doc.inventario.length === 0 && (
                    <p className="text-sm text-muted-foreground">Sin ítems. Agrega desde el selector.</p>
                  )}
                  {doc.inventario.map((l) => (
                    <div key={l.item_key} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{l.name}</span>
                      <span className="text-xs text-muted-foreground w-14 text-right">{(l.m3 * l.qty).toFixed(1)} m³</span>
                      <NumeroInput min={0} className="w-16 h-8" value={l.qty} vacioComo={0}
                        onCommit={(n) => setQty(l.item_key, n)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => quitar(l.item_key)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" size="sm" disabled={paso === 'general'}
                onClick={() => setPaso(paso === 'servicio' ? 'inventario' : 'general')}>Anterior</Button>
              {paso !== 'servicio' ? (
                <Button size="sm" onClick={() => setPaso(paso === 'general' ? 'inventario' : 'servicio')}>Siguiente</Button>
              ) : (
                <Button size="sm" onClick={() => imprimirDocumento(docRef.current, `Cotizacion-${doc.folio}`)}>
                  <Printer className="w-4 h-4 mr-1" /> Descargar PDF
                </Button>
              )}
            </div>

            <Collapsible className="rounded-xl border border-border">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-sm font-medium">
                Opciones avanzadas (todos los textos y secciones)
                <ChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
            <Tabs defaultValue="textos">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="textos">Textos</TabsTrigger>
                <TabsTrigger value="secciones">Secciones</TabsTrigger>
              </TabsList>
              {/* Textos */}
              <TabsContent value="textos" className="space-y-5 pt-4">
                {grupos.map((g) => {
                  const defs = TEXTO_DEFS.filter((t) => t.group === g);
                  if (!defs.length) return null;
                  const listField =
                    g === 'Materiales' ? 'materiales' : g === 'Acciones' ? 'acciones' : g === 'Observaciones' ? 'observaciones' : null;
                  return (
                    <div key={g} className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">{g}</h3>
                      {defs.map((t) => (
                        <div key={t.key} className="space-y-1">
                          <div className="flex items-center gap-2">
                            {listField && (
                              <Checkbox
                                checked={(doc[listField] as string[]).includes(t.key)}
                                onCheckedChange={() => toggleList(listField, t.key)}
                              />
                            )}
                            <Label className="text-xs text-muted-foreground">{t.label}</Label>
                            {TEXTO_VARIANTES[t.key] && (
                              <Select onValueChange={(v) => setTexto(t.key, v)}>
                                <SelectTrigger className="ml-auto h-7 w-40 text-xs">
                                  <SelectValue placeholder="Elegir variante…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TEXTO_VARIANTES[t.key].map((v, i) => (
                                    <SelectItem key={i} value={v} className="text-xs">
                                      Variante {i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Textarea
                            rows={2}
                            value={doc.textos[t.key] ?? cfg.textosDefault[t.key] ?? ''}
                            onChange={(e) => setTexto(t.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </TabsContent>

              {/* Secciones visibles (formato Moderno) */}
              <TabsContent value="secciones" className="space-y-3 pt-4">
                <p className="text-xs text-muted-foreground">
                  Elige qué bloques aparecen en el documento. Si dejas un texto vacío en la pestaña
                  "Textos", esa línea tampoco se imprime.
                </p>
                {SECCIONES_MODERNO.map((s) => (
                  <label key={s.key} className="flex items-center gap-3 text-sm">
                    <Switch
                      checked={doc.textos[`ver_${s.key}`] !== '0'}
                      onCheckedChange={(v) => setTexto(`ver_${s.key}`, v ? '1' : '0')}
                    />
                    {s.label}
                  </label>
                ))}
              </TabsContent>
            </Tabs>
            </CollapsibleContent>
            </Collapsible>
          </div>

          {/* ------------------------------- Vista previa ------------------------------- */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Vista previa · {previewPages} {previewPages === 1 ? 'página' : 'páginas'}</span>
              <input
                type="range" min={40} max={100} value={zoom * 100}
                onChange={(e) => setZoom(Number(e.target.value) / 100)}
                className="ml-auto w-32 accent-primary"
              />
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div className="rounded-xl bg-muted/40 p-4 overflow-auto">
              <div className="doc-scale-wrap mx-auto" style={{ width: 'fit-content' }}>
                <div
                  id="doc"
                  ref={docRef}
                  className="doc-editable doc-paginated-preview"
                  onClick={onPreviewClick}
                  style={{ zoom, width: '210mm' }}
                >
                  {doc.formato === 'marco' ? <DocMarco doc={doc} cfg={cfg} /> : <DocModerno doc={doc} cfg={cfg} />}
                </div>
              </div>
            </div>
          </div>

          <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editando?.titulo}</DialogTitle>
              </DialogHeader>
              {editando && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {editando.seccion && (
                    <label className="flex items-center gap-3 text-sm">
                      <Switch
                        checked={doc.textos[`ver_${editando.seccion}`] !== '0'}
                        onCheckedChange={(v) => setTexto(`ver_${editando.seccion}`, v ? '1' : '0')}
                      />
                      Mostrar esta sección en el documento
                    </label>
                  )}
                  {editando.keys.map((k) => {
                    const def = TEXTO_DEFS.find((t) => t.key === k);
                    const esMaterial = k.startsWith('mat_');
                    return (
                      <div key={k} className="space-y-1">
                        <div className="flex items-center gap-2">
                          {esMaterial && (
                            <Checkbox
                              checked={doc.materiales.includes(k)}
                              onCheckedChange={() => toggleList('materiales', k)}
                            />
                          )}
                          <Label className="text-xs text-muted-foreground">
                            {k === 'detalle_servicio' ? 'Detalle del servicio' : def?.label || k}
                          </Label>
                          {doc.textos[k] !== undefined && k !== 'detalle_servicio' && (
                            <Button
                              type="button" variant="link" size="sm" className="ml-auto h-auto px-0 text-xs"
                              onClick={() =>
                                setDoc((d) => {
                                  const { [k]: _omit, ...rest } = d.textos;
                                  return { ...d, textos: rest };
                                })
                              }
                            >
                              Restaurar
                            </Button>
                          )}
                        </div>
                        <Textarea
                          rows={2}
                          value={doc.textos[k] ?? cfg.textosDefault[k] ?? ''}
                          onChange={(e) => setTexto(k, e.target.value)}
                        />
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground">
                    Deja un texto vacío para ocultar esa línea. Puedes usar variables como {'{{m3}}'} o {'{{personas}}'}.
                  </p>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setEditando(null)}>Listo</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
};

export default GenerarCotizacion;

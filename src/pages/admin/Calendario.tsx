// Calendario de servicios agendados (mismo cambio que Railen, 2026-11-04): una grilla por mes
// con un puntito en los días que tienen servicios; al tocar un día aparece la lista de ese día,
// y cada tarjeta abre la cotización.
//
// «Agendado» = estado Confirmado (y Completado, en verde). Las cotizadas sin confirmar se
// pueden ver en gris con el interruptor. Pensado primero para celular.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/components/admin/AdminLayout';
import CambiarAgenda from '@/components/admin/CambiarAgenda';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/integrations/db';
import {
  DIAS_CORTOS,
  armarAgenda,
  fechaCorta,
  fechaDeAgenda,
  hoyEnChile,
  semanasDelMes,
  sumarMeses,
  tituloDelDia,
  tituloDelMes,
  unirConHoja,
  type CotizacionAgenda,
} from '@/lib/quote/agenda';
import { textoHora } from '@/lib/quote/horario';
import { formatCLP } from '@/lib/quote/pricing';

const COLOR_ESTADO: Record<string, string> = {
  confirmado: 'bg-primary',
  completado: 'bg-green-600',
  cotizado: 'bg-muted-foreground/50',
};

const ETIQUETA_ESTADO: Record<string, string> = {
  confirmado: 'Confirmado',
  completado: 'Completado',
  cotizado: 'Cotizado',
};

const Tarjeta = ({ q, onEditar }: { q: CotizacionAgenda; onEditar: (q: CotizacionAgenda) => void }) => {
  const nombre = [q.cliente_nombre, q.cliente_apellido].filter(Boolean).join(' ');
  const ruta = [q.origen_comuna, q.destino_comuna].filter(Boolean).join(' → ');
  const dia = fechaDeAgenda(q);
  const inicio = q.hoja?.hora_inicio ?? '';
  const fin = q.hoja?.hora_fin ?? '';
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 transition-colors">
      <Link
        to={`/admin/formularios/${q.id}`}
        className="flex gap-3 p-3"
        data-testid={`cal-tarjeta-${q.id}`}
        data-hora={textoHora(inicio, fin)}
      >
        {/* El horario a la izquierda, como una agenda: la hora de inicio arriba y la de término abajo. */}
        <div className="w-14 shrink-0 text-center border-r border-border pr-3" data-testid={`cal-hora-${q.id}`}>
          {inicio ? (
            <>
              <div className="text-sm font-semibold text-foreground">{inicio}</div>
              {fin && <div className="text-xs text-muted-foreground">{fin}</div>}
            </>
          ) : (
            <div className="text-xs text-muted-foreground leading-tight pt-0.5">Sin hora</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${COLOR_ESTADO[q.estado] ?? 'bg-muted-foreground/50'}`} />
              {ETIQUETA_ESTADO[q.estado] ?? q.estado}
            </span>
            <span className="font-semibold text-foreground whitespace-nowrap">
              {q.hoja?.precio != null ? formatCLP(q.hoja.precio) : 'Sin precio'}
            </span>
          </div>
          <div className="mt-1 font-medium text-foreground">{nombre}</div>
          {ruta && <div className="text-sm text-muted-foreground">{ruta}</div>}
          <div className="mt-1 text-xs text-muted-foreground">
            {q.hoja ? `N° ${q.hoja.folio}` : 'Sin hoja todavía'}
            {dia && ` · ${fechaCorta(dia)}`}
          </div>
        </div>
      </Link>
      <div className="border-t border-border px-3 py-1.5 text-right">
        <button
          type="button"
          onClick={() => onEditar(q)}
          className="text-xs font-medium text-primary hover:underline"
          data-testid={`cal-editar-${q.id}`}
        >
          Cambiar fecha y hora
        </button>
      </div>
    </div>
  );
};

const Calendario = () => {
  const { toast } = useToast();
  const hoy = hoyEnChile();
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const [seleccionado, setSeleccionado] = useState<string | null>(hoy);
  const [cotizadas, setCotizadas] = useState(false);
  const [lista, setLista] = useState<CotizacionAgenda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<CotizacionAgenda | null>(null);

  const cargar = async () => {
    const [q, d] = await Promise.all([db.from('quotes').select('*'), db.from('quote_documents').select('*')]);
    if (q.error || d.error) {
      console.error('No se pudo cargar el calendario:', q.error ?? d.error);
      toast({ title: 'Error', description: 'No se pudo cargar el calendario.', variant: 'destructive' });
    } else {
      setLista(unirConHoja(q.data ?? [], d.data ?? []));
    }
    setCargando(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { porDia, sinFecha } = useMemo(() => armarAgenda(lista, cotizadas), [lista, cotizadas]);
  const semanas = useMemo(() => semanasDelMes(mes), [mes]);

  const delMes = useMemo(() => {
    let n = 0;
    for (const [dia, qs] of porDia) if (dia.startsWith(mes)) n += qs.length;
    return n;
  }, [porDia, mes]);

  const delDia = seleccionado ? (porDia.get(seleccionado) ?? []) : [];

  const irAMes = (nuevo: string) => {
    setMes(nuevo);
    setSeleccionado(nuevo === hoy.slice(0, 7) ? hoy : null);
  };

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-2xl">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Calendario</h1>
          <p className="text-muted-foreground mt-1">Servicios agendados por día.</p>
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="icon" onClick={() => irAMes(sumarMeses(mes, -1))} aria-label="Mes anterior">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <div className="font-semibold capitalize" data-testid="cal-mes">
                {tituloDelMes(mes)}
              </div>
              <div className="text-xs text-muted-foreground">
                {delMes === 1 ? '1 servicio' : `${delMes} servicios`}
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={() => irAMes(sumarMeses(mes, 1))} aria-label="Mes siguiente">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {cargando ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 text-center" data-testid="cal-grilla">
              {DIAS_CORTOS.map((d) => (
                <div key={d} className="text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
              {semanas.flat().map((dia, i) => {
                if (!dia) return <div key={`v${i}`} />;
                const qs = porDia.get(dia) ?? [];
                const activo = dia === seleccionado;
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => setSeleccionado(dia)}
                    data-testid={`cal-dia-${dia}`}
                    aria-label={`${tituloDelDia(dia)}${qs.length ? `, ${qs.length} servicios` : ''}`}
                    aria-pressed={activo}
                    className={[
                      'flex flex-col items-center justify-start gap-1 rounded-lg py-1.5 min-h-[3.25rem] text-sm transition-colors',
                      activo ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                      dia === hoy && !activo ? 'ring-1 ring-primary' : '',
                    ].join(' ')}
                  >
                    <span>{Number(dia.slice(8))}</span>
                    {qs.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        {qs.slice(0, 3).map((q) => (
                          <span
                            key={q.id}
                            className={`h-1.5 w-1.5 rounded-full ${activo ? 'bg-primary-foreground' : (COLOR_ESTADO[q.estado] ?? 'bg-muted-foreground/50')}`}
                          />
                        ))}
                        {qs.length > 3 && <span className="text-[10px] leading-none">+{qs.length - 3}</span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Switch id="cal-cotizadas" checked={cotizadas} onCheckedChange={setCotizadas} />
              <Label htmlFor="cal-cotizadas" className="text-sm">
                Ver también las cotizadas sin confirmar
              </Label>
            </div>
            <Button variant="ghost" size="sm" onClick={() => irAMes(hoy.slice(0, 7))}>
              Hoy
            </Button>
          </div>
        </div>

        <section className="space-y-2" data-testid="cal-lista">
          {seleccionado ? (
            <>
              <h2 className="font-semibold first-letter:uppercase text-foreground">{tituloDelDia(seleccionado)}</h2>
              {delDia.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay servicios agendados este día.</p>
              ) : (
                <div className="space-y-2">
                  {delDia.map((q) => (
                    <Tarjeta key={q.id} q={q} onEditar={setEditando} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Toca un día para ver sus servicios.</p>
          )}
        </section>

        {sinFecha.length > 0 && (
          <section className="space-y-2" data-testid="cal-sin-fecha">
            <h2 className="font-semibold text-foreground">Agendados sin fecha ({sinFecha.length})</h2>
            <p className="text-sm text-muted-foreground">
              Ponles fecha con «Cambiar fecha y hora» para que aparezcan en el calendario.
            </p>
            <div className="space-y-2">
              {sinFecha.map((q) => (
                <Tarjeta key={q.id} q={q} onEditar={setEditando} />
              ))}
            </div>
          </section>
        )}
      </div>
      {editando && <CambiarAgenda quote={editando} onCerrar={() => setEditando(null)} onGuardado={cargar} />}
    </AdminLayout>
  );
};

export default Calendario;

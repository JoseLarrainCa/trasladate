// «Cambiar fecha y hora» desde el calendario: como en Google Calendar, se toca el servicio y se
// mueve ahí mismo, sin ir a «Cotizar». Guarda en la cotización y en su hoja, así que el
// calendario y la hoja siguen diciendo lo mismo.
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/integrations/db';
import { fechaDeAgenda, type CotizacionAgenda } from '@/lib/quote/agenda';
import { horarioValido } from '@/lib/quote/horario';

interface Props {
  quote: CotizacionAgenda;
  onCerrar: () => void;
  /** Se llama después de guardar, para que la pantalla vuelva a leer la lista. */
  onGuardado: () => void;
}

const CambiarAgenda = ({ quote, onCerrar, onGuardado }: Props) => {
  const { toast } = useToast();
  const [fecha, setFecha] = useState(fechaDeAgenda(quote));
  const [inicio, setInicio] = useState(quote.hoja?.hora_inicio ?? '');
  const [fin, setFin] = useState(quote.hoja?.hora_fin ?? '');
  const [guardando, setGuardando] = useState(false);

  const sinHoja = !quote.hoja;
  const valido = Boolean(fecha) && horarioValido(inicio, fin);
  const nombre = [quote.cliente_nombre, quote.cliente_apellido].filter(Boolean).join(' ');

  const guardar = async () => {
    setGuardando(true);
    try {
      const q = await db.from('quotes').update({ fecha_traslado: fecha }).eq('id', quote.id);
      if (q.error) throw new Error(q.error.message);
      if (quote.hoja) {
        const h = await db
          .from('quote_documents')
          .update({ fecha_servicio: fecha, hora_inicio: inicio || null, hora_fin: inicio ? fin || null : null })
          .eq('id', quote.hoja.id);
        if (h.error) throw new Error(h.error.message);
      }
      toast({ title: 'Fecha y hora guardadas' });
      onGuardado();
      onCerrar();
    } catch (e) {
      toast({
        title: 'No se pudo guardar',
        description: e instanceof Error ? e.message : 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(a) => !a && !guardando && onCerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar fecha y hora</DialogTitle>
          <DialogDescription>
            {quote.hoja ? `Cotización N° ${quote.hoja.folio} · ` : ''}
            {nombre}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ca-fecha">Fecha del servicio</Label>
            <Input id="ca-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ca-inicio">Hora de inicio</Label>
              <Input
                id="ca-inicio"
                type="time"
                value={inicio}
                disabled={sinHoja}
                onChange={(e) => setInicio(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ca-fin">Hora de término (opcional)</Label>
              <Input
                id="ca-fin"
                type="time"
                value={fin}
                min={inicio || undefined}
                disabled={sinHoja || !inicio}
                onChange={(e) => setFin(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {sinHoja && (
            <p className="text-xs text-muted-foreground" data-testid="ca-sin-hoja">
              Esta cotización todavía no tiene hoja: arma la hoja en «Generar cotización» para ponerle hora. La fecha sí
              se puede cambiar acá.
            </p>
          )}
          {!horarioValido(inicio, fin) && (
            <p className="text-xs text-destructive" data-testid="ca-horario-invalido">
              La hora de término tiene que ser después de la de inicio.
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={!valido || guardando} data-testid="ca-guardar">
              {guardando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CambiarAgenda;

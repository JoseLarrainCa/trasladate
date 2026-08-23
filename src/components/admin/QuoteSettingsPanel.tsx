import { useEffect, useState } from 'react';
import { FileText, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_EMPRESA,
  DEFAULT_TARIFAS,
  DEFAULT_TEXTOS,
  TARIFA_LABELS,
  TEXTO_DEFS,
  type Empresa,
  type Tarifas,
} from '@/lib/quote/defaults';

const EMPRESA_LABELS: Record<keyof Empresa, string> = {
  titular: 'Titular de la cuenta',
  banco: 'Banco',
  cuenta: 'Tipo de cuenta',
  numero: 'N° de cuenta',
  rut: 'RUT',
  correo: 'Correo',
  wsp1: 'WhatsApp 1',
  wsp2: 'WhatsApp 2',
  web: 'Página web',
  akikb_correo: 'akikb — correo',
  akikb_wsp: 'akikb — WhatsApp',
  akikb_oficina: 'akikb — oficina',
};

const QuoteSettingsPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const [tarifas, setTarifas] = useState<Tarifas>(DEFAULT_TARIFAS);
  const [empresa, setEmpresa] = useState<Empresa>(DEFAULT_EMPRESA);
  const [textos, setTextos] = useState<Record<string, string>>(DEFAULT_TEXTOS);
  const [folio, setFolio] = useState(3286);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any).from('quote_settings').select('*').maybeSingle();
      if (data) {
        setRowId(data.id);
        setTarifas({ ...DEFAULT_TARIFAS, ...(data.tarifas || {}) });
        setEmpresa({ ...DEFAULT_EMPRESA, ...(data.empresa || {}) });
        setTextos({ ...DEFAULT_TEXTOS, ...(data.textos || {}) });
        setFolio(data.siguiente_folio ?? 3286);
      }
      setLoading(false);
    };
    load();
  }, []);

  const guardar = async () => {
    setSaving(true);
    const sb = supabase as any;
    const payload = { tarifas, empresa, textos, siguiente_folio: folio, updated_at: new Date().toISOString() };
    const { error } = rowId
      ? await sb.from('quote_settings').update(payload).eq('id', rowId)
      : await sb.from('quote_settings').insert(payload);
    setSaving(false);
    toast(
      error
        ? { title: 'Error', description: error.message, variant: 'destructive' }
        : { title: 'Configuración guardada', description: 'Los cambios se aplican a las próximas cotizaciones' }
    );
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Cotizaciones PDF
      </h2>

      <Tabs defaultValue="tarifas">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
          <TabsTrigger value="empresa">Datos</TabsTrigger>
          <TabsTrigger value="textos">Textos</TabsTrigger>
        </TabsList>

        <TabsContent value="tarifas" className="pt-4 grid grid-cols-2 gap-3">
          {(Object.keys(TARIFA_LABELS) as (keyof Tarifas)[]).map((k) => (
            <div key={k}>
              <Label className="text-xs">{TARIFA_LABELS[k]}</Label>
              <Input
                type="number"
                className="mt-1"
                value={tarifas[k]}
                onChange={(e) => setTarifas({ ...tarifas, [k]: Number(e.target.value) || 0 })}
              />
            </div>
          ))}
          <div>
            <Label className="text-xs">Siguiente N° de servicio</Label>
            <Input type="number" className="mt-1" value={folio} onChange={(e) => setFolio(Number(e.target.value) || 0)} />
          </div>
        </TabsContent>

        <TabsContent value="empresa" className="pt-4 grid grid-cols-2 gap-3">
          {(Object.keys(EMPRESA_LABELS) as (keyof Empresa)[]).map((k) => (
            <div key={k}>
              <Label className="text-xs">{EMPRESA_LABELS[k]}</Label>
              <Input
                className="mt-1"
                value={empresa[k]}
                onChange={(e) => setEmpresa({ ...empresa, [k]: e.target.value })}
              />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="textos" className="pt-4 space-y-3">
          {TEXTO_DEFS.map((t) => (
            <div key={t.key}>
              <Label className="text-xs text-muted-foreground">
                {t.group} — {t.label}
              </Label>
              <Textarea
                rows={2}
                className="mt-1"
                value={textos[t.key] ?? ''}
                onChange={(e) => setTextos({ ...textos, [t.key]: e.target.value })}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Puedes usar variables como {'{{nombre}}'}, {'{{m3}}'}, {'{{precio}}'}, {'{{origenComuna}}'}.
          </p>
        </TabsContent>
      </Tabs>

      <Button onClick={guardar} disabled={saving} className="gap-2 mt-5">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar configuración
      </Button>
    </div>
  );
};

export default QuoteSettingsPanel;

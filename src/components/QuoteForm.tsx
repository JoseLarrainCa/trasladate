import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  User,
  MapPin,
  Package,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Send,
  Loader2,
  Home,
  Building2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { sendToFormspree } from '@/lib/formspree';
import { INVENTORY_CATEGORIES, VIVIENDA_OPTIONS, MUDANZA_OPTIONS } from '@/lib/constants';
import { calculateTotalM3, m3ToM2, getInventoryItem } from '@/lib/constants/inventory';
import type { QuoteInsert, QuoteItemInsert } from '@/types/database';

// Form data type
interface FormData {
  // Cliente
  clienteNombre: string;
  clienteApellido: string;
  telefono: string;
  celular: string;
  email: string;
  // Origen
  origenDireccion: string;
  origenComuna: string;
  origenTipo: string;
  origenPiso: string;
  origenAscensor: boolean;
  // Destino
  destinoDireccion: string;
  destinoComuna: string;
  destinoTipo: string;
  destinoPiso: string;
  destinoAscensor: boolean;
  // Detalles
  tipoMudanza: string;
  tipoServicio: string;
  fechaTraslado: string;
  fechaIndefinida: boolean;
  sugerenciaAdicional: string;
}

const initialFormData: FormData = {
  clienteNombre: '',
  clienteApellido: '',
  telefono: '',
  celular: '',
  email: '',
  origenDireccion: '',
  origenComuna: '',
  origenTipo: 'departamento',
  origenPiso: '',
  origenAscensor: false,
  destinoDireccion: '',
  destinoComuna: '',
  destinoTipo: 'departamento',
  destinoPiso: '',
  destinoAscensor: false,
  tipoMudanza: 'hogar',
  tipoServicio: 'express',
  fechaTraslado: '',
  fechaIndefinida: false,
  sugerenciaAdicional: '',
};

const createQuoteId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16)
  );
};

const SERVICIO_OPTIONS = [
  { value: 'express', label: 'Servicio Express' },
  { value: 'principal', label: 'Servicio Principal' },
  { value: 'exclusivo', label: 'Servicio Exclusivo' },
];

// Los textos de cada servicio se cargan desde la base de datos (editables en el panel admin);
// mientras tanto se usan los valores por defecto.

const steps = [
  { id: 1, title: 'Datos Generales', icon: User },
  { id: 2, title: 'Inventario', icon: Package },
];

const QuoteForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<{ name: string; qty: number }[]>([
    { name: '', qty: 0 },
    { name: '', qty: 0 },
    { name: '', qty: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const { ref, isVisible } = useScrollAnimation();
  const { toast } = useToast();

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateInventory = (key: string, value: number) => {
    setInventory((prev) => {
      if (value <= 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const validateStep1 = (): boolean => {
    const required = [
      formData.clienteNombre,
      formData.telefono,
      formData.origenDireccion,
      formData.origenComuna,
      formData.destinoDireccion,
      formData.destinoComuna,
    ];
    return required.every((field) => field.trim() !== '');
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa los campos obligatorios (*).',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(2);
  };

  const prevStep = () => setCurrentStep(1);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Generate UUID in frontend
      const quoteId = createQuoteId();
      let savedInDatabase = false;

      // Build inventory list (used for both DB and email)
      const inventoryItems: QuoteItemInsert[] = Object.entries(inventory)
        .filter(([_, qty]) => qty > 0)
        .map(([key, quantity]) => {
          const item = INVENTORY_CATEGORIES.flatMap((c) => c.items).find((i) => i.key === key);
          return {
            quote_id: quoteId,
            item_key: key,
            item_name: item?.name || key,
            category: item?.category || 'OTROS CLIENTE',
            quantity,
          };
        });

      const customInventoryItems: QuoteItemInsert[] = customItems
        .filter((ci) => ci.name.trim() && ci.qty > 0)
        .map((ci, idx) => ({
          quote_id: quoteId,
          item_key: `custom_${idx}`,
          item_name: ci.name.trim(),
          category: 'OTROS CLIENTE',
          quantity: ci.qty,
        }));

      const allItems = [...inventoryItems, ...customInventoryItems];

      // Try to save to database (optional — don't block if it fails)
      try {
        const quoteData: QuoteInsert = {
          id: quoteId,
          cliente_nombre: formData.clienteNombre,
          cliente_apellido: formData.clienteApellido || null,
          telefono: formData.telefono,
          celular: formData.celular || null,
          email: formData.email || null,
          origen_direccion: formData.origenDireccion,
          origen_comuna: formData.origenComuna,
          origen_tipo_vivienda: formData.origenTipo as any,
          origen_piso: formData.origenPiso ? parseInt(formData.origenPiso) : null,
          origen_tiene_ascensor: formData.origenAscensor,
          destino_direccion: formData.destinoDireccion,
          destino_comuna: formData.destinoComuna,
          destino_tipo_vivienda: formData.destinoTipo as any,
          destino_piso: formData.destinoPiso ? parseInt(formData.destinoPiso) : null,
          destino_tiene_ascensor: formData.destinoAscensor,
          tipo_mudanza: formData.tipoMudanza as any,
          fecha_traslado: formData.fechaTraslado || null,
          fecha_indefinida: formData.fechaIndefinida,
          sugerencia_adicional: [
            formData.tipoMudanza === 'hogar'
              ? `Tipo de servicio: ${SERVICIO_OPTIONS.find((o) => o.value === formData.tipoServicio)?.label}`
              : '',
            formData.sugerenciaAdicional,
          ]
            .filter(Boolean)
            .join(' | ') || null,
        };

        const { error: quoteError } = await (supabase as any)
          .from('quotes')
          .insert(quoteData);

        if (!quoteError) {
          savedInDatabase = true;
        }

        if (!quoteError && allItems.length > 0) {
          const { error: itemsError } = await (supabase as any).from('quote_items').insert(allItems);
          if (itemsError) {
            console.warn('Quote items save skipped:', itemsError.message);
          }
        }
        if (quoteError) {
          console.warn('DB save skipped:', quoteError.message);
        }
      } catch (dbErr) {
        console.warn('DB save failed, continuing with email notification:', dbErr);
      }

      // Build inventory grouped by category, in the canonical order of INVENTORY_CATEGORIES,
      // showing only quantities (no m³), to match the legacy email format the admin team prefers.
      const categoryOrder = INVENTORY_CATEGORIES.map((c) => c.name);
      const itemsByCategory: Record<string, { name: string; quantity: number }[]> = {};
      for (const it of allItems) {
        const cat = it.category || 'OTROS CLIENTE';
        if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
        itemsByCategory[cat].push({ name: it.item_name, quantity: it.quantity });
      }
      const orderedCategories = [
        ...categoryOrder.filter((c) => itemsByCategory[c]),
        ...Object.keys(itemsByCategory).filter((c) => !categoryOrder.includes(c)),
      ];
      // Always include OTROS at the end if not present (legacy format does so)
      if (!orderedCategories.includes('OTROS CLIENTE')) orderedCategories.push('OTROS CLIENTE');

      const inventarioFormateado = orderedCategories
        .map((cat) => {
          const items = itemsByCategory[cat] || [];
          const lines = items.map((i) => `${i.name}: ${i.quantity}`).join('\n');
          return `${cat}:\n${lines}`.trimEnd();
        })
        .join('\n\n');

      const fechaStr = formData.fechaIndefinida
        ? 'Fecha indefinida'
        : (formData.fechaTraslado || 'No especificada');

      const totalItemsCount = allItems.reduce((sum, it) => sum + it.quantity, 0);
      const totalCajas = allItems
        .filter((it) => it.item_name.toLowerCase().includes('caja'))
        .reduce((sum, it) => sum + it.quantity, 0);
      const tipoServicioLabel =
        formData.tipoMudanza === 'hogar'
          ? SERVICIO_OPTIONS.find((o) => o.value === formData.tipoServicio)?.label || '---'
          : '---';

      const ascensorOrigen = formData.origenAscensor ? 'Si' : 'No';
      const ascensorDestino = formData.destinoAscensor ? 'Si' : 'No';
      const pisoOrigen = formData.origenPiso || '---';
      const pisoDestino = formData.destinoPiso || '---';

      const tipoViviendaOrigen = VIVIENDA_OPTIONS.find((v) => v.value === formData.origenTipo)?.label || formData.origenTipo;
      const tipoViviendaDestino = VIVIENDA_OPTIONS.find((v) => v.value === formData.destinoTipo)?.label || formData.destinoTipo;

      const mensajeLegacy = `DATOS DEL CLIENTE:
__________________
Cliente: ${formData.clienteNombre} ${formData.clienteApellido}
Telefono: ${formData.telefono}
Celular: ${formData.celular || '---'}
Correo: ${formData.email || '---'}

DATOS VIVIENDA ORIGEN
_____________________
Direccion origen: ${formData.origenDireccion}
Comuna origen: ${formData.origenComuna}
Tipo de vivienda: ${tipoViviendaOrigen}
Numero departamento: ${pisoOrigen}
Ascensor: ${ascensorOrigen}

DATOS VIVIENDA DESTINO
_______________________
Direccion destino: ${formData.destinoDireccion}
Comuna destino: ${formData.destinoComuna}
Tipo de vivienda destino: ${tipoViviendaDestino}
Numero departamento: ${pisoDestino}
Ascensor destino: ${ascensorDestino}
TIPO DE SERVICIO: ${tipoServicioLabel}
FECHA DE TRASLADO: ${fechaStr}
Sugerencia (Parte del cliente): ${formData.sugerenciaAdicional || '---'}

DESCRIPCION DETALLADA
_______________________
Total de metros cubicos: ${totalM3.toFixed(2)}
Cantidad total de items: ${totalItemsCount}
Cantidad de cajas: ${totalCajas}

${inventarioFormateado}`;

      const emailOk = await sendToFormspree({
        _subject: `COTIZACION DE CLIENTE - PAGINA WEB`,
        message: mensajeLegacy,
      });

      if (!emailOk && !savedInDatabase) {
        throw new Error('No se pudo guardar ni enviar la cotización');
      }

      if (!emailOk) {
        console.warn('Formspree notification failed, but quote was saved in the database');
      }

      setSubmittedId(quoteId);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al enviar tu cotización. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCustomItemsTotal = () => customItems.reduce((sum, ci) => sum + (ci.name.trim() ? ci.qty : 0), 0);
  const getTotalItems = () => Object.values(inventory).reduce((sum, qty) => sum + qty, 0) + getCustomItemsTotal();
  const totalM3 = calculateTotalM3(inventory);
  const totalM2 = m3ToM2(totalM3);

  // Success screen
  if (isSubmitted) {
    return (
      <section id="cotizacion" className="py-20 md:py-28 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-lg mx-auto text-center bg-card rounded-3xl p-12 shadow-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-4">
              ¡Solicitud Enviada!
            </h3>
            <p className="text-muted-foreground mb-2">
              Tu cotización fue registrada exitosamente.
            </p>
            {submittedId && (
              <p className="text-sm text-muted-foreground mb-6">
                Referencia: <span className="font-mono font-medium">#{submittedId.slice(0, 8)}</span>
              </p>
            )}
            <p className="text-muted-foreground mb-6">
              Tu cotización quedó registrada en nuestro sistema. La revisaremos y te contactaremos pronto.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setSubmittedId(null);
                  setCurrentStep(1);
                  setFormData(initialFormData);
                  setInventory({});
                  setCustomItems([{ name: '', qty: 0 }, { name: '', qty: 0 }, { name: '', qty: 0 }]);
                }}
              >
                Nueva Cotización
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="cotizacion" className="py-20 md:py-28 bg-muted/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div ref={ref} className={`text-center mb-12 scroll-animate ${isVisible ? 'visible' : ''}`}>
          <span className="inline-block text-primary font-semibold text-base md:text-lg uppercase tracking-wider mb-4">
            Cotización Online
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
            Solicita tu presupuesto gratis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Completa el formulario en 2 simples pasos y te contactaremos con un presupuesto personalizado.
          </p>
        </div>

        {/* Progress steps */}
        <div className="max-w-md mx-auto mb-10">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-cta-gradient text-primary-foreground shadow-cta'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                      animate={{ scale: isActive ? 1.1 : 1 }}
                    >
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </motion.div>
                    <span
                      className={`text-sm mt-2 font-medium ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-20 sm:w-32 h-1 mx-4 rounded-full transition-colors ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form card */}
        <div className="max-w-4xl mx-auto">
          <motion.div className="bg-card rounded-3xl p-6 md:p-10 shadow-card" layout>
            <AnimatePresence mode="wait">
              {/* Step 1: General Data */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Cliente Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <User className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-heading font-semibold text-foreground">
                        Datos del Cliente
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clienteNombre">Nombres / Razón Social *</Label>
                        <Input
                          id="clienteNombre"
                          value={formData.clienteNombre}
                          onChange={(e) => updateField('clienteNombre', e.target.value)}
                          placeholder="Ej: Juan"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clienteApellido">Apellido(s)</Label>
                        <Input
                          id="clienteApellido"
                          value={formData.clienteApellido}
                          onChange={(e) => updateField('clienteApellido', e.target.value)}
                          placeholder="Ej: Pérez"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefono">Teléfono *</Label>
                        <Input
                          id="telefono"
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => updateField('telefono', e.target.value)}
                          placeholder="Ej: +56 9 1234 5678"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="celular">Celular</Label>
                        <Input
                          id="celular"
                          type="tel"
                          value={formData.celular}
                          onChange={(e) => updateField('celular', e.target.value)}
                          placeholder="Ej: +56 9 8765 4321"
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="Ej: correo@ejemplo.cl"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Origen Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="w-5 h-5 text-green-500" />
                      <h3 className="text-lg font-heading font-semibold text-foreground">
                        Punto de Origen
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="origenDireccion">Dirección *</Label>
                        <Input
                          id="origenDireccion"
                          value={formData.origenDireccion}
                          onChange={(e) => updateField('origenDireccion', e.target.value)}
                          placeholder="Ej: Av. Providencia 1234"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="origenComuna">Comuna *</Label>
                        <Input
                          id="origenComuna"
                          value={formData.origenComuna}
                          onChange={(e) => updateField('origenComuna', e.target.value)}
                          placeholder="Ej: Providencia"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Tipo de vivienda</Label>
                        <Select
                          value={formData.origenTipo}
                          onValueChange={(value) => updateField('origenTipo', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VIVIENDA_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="origenPiso">Piso (opcional)</Label>
                        <Input
                          id="origenPiso"
                          type="number"
                          min="1"
                          value={formData.origenPiso}
                          onChange={(e) => updateField('origenPiso', e.target.value)}
                          placeholder="Ej: 5"
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <Checkbox
                          id="origenAscensor"
                          checked={formData.origenAscensor}
                          onCheckedChange={(checked) => updateField('origenAscensor', checked as boolean)}
                        />
                        <Label htmlFor="origenAscensor" className="cursor-pointer">
                          Tiene ascensor en origen
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Destino Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="w-5 h-5 text-red-500" />
                      <h3 className="text-lg font-heading font-semibold text-foreground">
                        Punto de Destino
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="destinoDireccion">Dirección *</Label>
                        <Input
                          id="destinoDireccion"
                          value={formData.destinoDireccion}
                          onChange={(e) => updateField('destinoDireccion', e.target.value)}
                          placeholder="Ej: Los Leones 567"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="destinoComuna">Comuna *</Label>
                        <Input
                          id="destinoComuna"
                          value={formData.destinoComuna}
                          onChange={(e) => updateField('destinoComuna', e.target.value)}
                          placeholder="Ej: Las Condes"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Tipo de vivienda</Label>
                        <Select
                          value={formData.destinoTipo}
                          onValueChange={(value) => updateField('destinoTipo', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VIVIENDA_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="destinoPiso">Piso (opcional)</Label>
                        <Input
                          id="destinoPiso"
                          type="number"
                          min="1"
                          value={formData.destinoPiso}
                          onChange={(e) => updateField('destinoPiso', e.target.value)}
                          placeholder="Ej: 3"
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <Checkbox
                          id="destinoAscensor"
                          checked={formData.destinoAscensor}
                          onCheckedChange={(checked) => updateField('destinoAscensor', checked as boolean)}
                        />
                        <Label htmlFor="destinoAscensor" className="cursor-pointer">
                          Tiene ascensor en destino
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Detalles Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-heading font-semibold text-foreground">
                        Detalles del Traslado
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de mudanza</Label>
                        <Select
                          value={formData.tipoMudanza}
                          onValueChange={(value) => updateField('tipoMudanza', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MUDANZA_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.tipoMudanza === 'hogar' && (
                        <div>
                          <Label>Tipo de servicio</Label>
                          <Select
                            value={formData.tipoServicio}
                            onValueChange={(value) => updateField('tipoServicio', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICIO_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="fechaTraslado">Fecha tentativa</Label>
                        <Input
                          id="fechaTraslado"
                          type="date"
                          value={formData.fechaTraslado}
                          onChange={(e) => updateField('fechaTraslado', e.target.value)}
                          disabled={formData.fechaIndefinida}
                          className="mt-1"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox
                            id="fechaIndefinida"
                            checked={formData.fechaIndefinida}
                            onCheckedChange={(checked) => updateField('fechaIndefinida', checked as boolean)}
                          />
                          <Label htmlFor="fechaIndefinida" className="cursor-pointer text-sm">
                            Aún no lo decido
                          </Label>
                        </div>
                       </div>
                      {formData.tipoMudanza === 'hogar' && SERVICIO_DETALLES[formData.tipoServicio] && (
                        <div className="rounded-xl border border-border bg-muted/40 p-4">
                          <p className="font-heading font-semibold text-foreground text-sm mb-2">
                            {SERVICIO_DETALLES[formData.tipoServicio].titulo}
                          </p>
                          <ul className="space-y-2">
                            {SERVICIO_DETALLES[formData.tipoServicio].lineas.map((l) => (
                              <li key={l.label} className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-foreground">{l.label}: </span>
                                {l.texto}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <Label htmlFor="sugerenciaAdicional">Sugerencia adicional</Label>
                        <Textarea
                          id="sugerenciaAdicional"
                          value={formData.sugerenciaAdicional}
                          onChange={(e) => updateField('sugerenciaAdicional', e.target.value)}
                          placeholder="Describe brevemente qué muebles o artículos principales tienes, si hay objetos delicados, pianos, cajas fuertes, etc."
                          className="mt-1 min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Inventory */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-heading font-semibold text-foreground">
                        Inventario de Muebles
                      </h3>
                    </div>
                    {getTotalItems() > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                          {getTotalItems()} items
                        </span>
                        <span className="text-sm bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full font-medium">
                          {totalM3.toFixed(2)} m³ camión
                        </span>
                        <span className="text-sm bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full font-medium">
                          {totalM2.toFixed(2)} m² bodega
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Indica la cantidad de cada mueble que necesitas trasladar. Deja en 0 los que no aplican.
                  </p>



                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {INVENTORY_CATEGORIES.map((category) => (
                      <div key={category.key} className="bg-muted/50 rounded-xl p-4">
                        <h4 className="font-semibold text-primary text-sm mb-3 uppercase tracking-wider">
                          {category.name}
                        </h4>
                        <div className="space-y-2">
                          {category.items.map((item) => {
                            return (
                              <div key={item.key} className="flex items-center justify-between gap-2">
                                <span className="text-sm text-foreground flex-1 leading-tight">
                                  {item.name}
                                </span>

                                <Input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={inventory[item.key] || ''}
                                  onChange={(e) =>
                                    updateInventory(item.key, parseInt(e.target.value) || 0)
                                  }
                                  className="w-16 h-8 text-center p-1"
                                  placeholder="0"
                                />
                              </div>
                            );
                          })}
                          {/* Custom editable items for OTROS */}
                          {category.key === 'otros' && (
                            <>
                              {customItems.map((ci, idx) => (
                                <div key={`custom-${idx}`} className="flex items-center gap-2">
                                  <Input
                                    value={ci.name}
                                    onChange={(e) => {
                                      const updated = [...customItems];
                                      updated[idx] = { ...updated[idx], name: e.target.value };
                                      setCustomItems(updated);
                                    }}
                                    placeholder={`Otro item ${idx + 1}`}
                                    maxLength={100}
                                    className="flex-1 h-8 text-sm"
                                  />
                                  <Input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={ci.qty || ''}
                                    onChange={(e) => {
                                      const updated = [...customItems];
                                      updated[idx] = { ...updated[idx], qty: parseInt(e.target.value) || 0 };
                                      setCustomItems(updated);
                                    }}
                                    className="w-16 h-8 text-center p-1"
                                    placeholder="0"
                                  />
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full mt-2 gap-1 text-xs border-dashed border-primary/30 text-primary hover:bg-primary/5"
                                onClick={() => setCustomItems((prev) => [...prev, { name: '', qty: 0 }])}
                              >
                                <Plus className="w-3 h-3" />
                                Agregar otro item
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </Button>

              {currentStep === 1 ? (
                <Button onClick={nextStep} className="bg-cta-gradient text-primary-foreground gap-2">
                  Siguiente: Agregar Muebles
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-500 hover:bg-green-600 text-white gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Cotización
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default QuoteForm;

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, MapPin, Home, Building2, Calendar, Package, 
  ArrowRight, ArrowLeft, CheckCircle, Send, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToast } from '@/hooks/use-toast';

type FormData = {
  // Step 1: Contact
  nombre: string;
  telefono: string;
  email: string;
  // Step 2: Origin
  origenDireccion: string;
  origenComuna: string;
  origenTipo: string;
  origenAscensor: boolean;
  // Step 3: Destination
  destinoDireccion: string;
  destinoComuna: string;
  destinoTipo: string;
  destinoAscensor: boolean;
  // Step 4: Details
  tipoMudanza: string;
  fechaTentativa: string;
  descripcion: string;
};

const initialFormData: FormData = {
  nombre: '',
  telefono: '',
  email: '',
  origenDireccion: '',
  origenComuna: '',
  origenTipo: 'departamento',
  origenAscensor: false,
  destinoDireccion: '',
  destinoComuna: '',
  destinoTipo: 'departamento',
  destinoAscensor: false,
  tipoMudanza: 'hogar',
  fechaTentativa: '',
  descripcion: '',
};

const viviendaOptions = [
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa-1', label: 'Casa 1 piso' },
  { value: 'casa-2', label: 'Casa 2+ pisos' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'bodega', label: 'Bodega' },
];

const mudanzaOptions = [
  { value: 'hogar', label: 'Mudanza del Hogar', icon: Home },
  { value: 'oficina', label: 'Mudanza de Oficina', icon: Building2 },
  { value: 'especial', label: 'Traslado Especial', icon: Package },
];

const steps = [
  { id: 1, title: 'Contacto', icon: User },
  { id: 2, title: 'Origen', icon: MapPin },
  { id: 3, title: 'Destino', icon: MapPin },
  { id: 4, title: 'Detalles', icon: Calendar },
];

const QuoteForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { ref, isVisible } = useScrollAnimation();
  const { toast } = useToast();

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.nombre.trim() !== '' && formData.telefono.trim() !== '';
      case 2:
        return formData.origenDireccion.trim() !== '' && formData.origenComuna.trim() !== '';
      case 3:
        return formData.destinoDireccion.trim() !== '' && formData.destinoComuna.trim() !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa los campos obligatorios.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Build WhatsApp message
    const message = `*Nueva Cotización de Mudanza*

*Datos de Contacto:*
• Nombre: ${formData.nombre}
• Teléfono: ${formData.telefono}
• Email: ${formData.email || 'No proporcionado'}

*Origen:*
• Dirección: ${formData.origenDireccion}, ${formData.origenComuna}
• Tipo: ${viviendaOptions.find(o => o.value === formData.origenTipo)?.label}
• Ascensor: ${formData.origenAscensor ? 'Sí' : 'No'}

*Destino:*
• Dirección: ${formData.destinoDireccion}, ${formData.destinoComuna}
• Tipo: ${viviendaOptions.find(o => o.value === formData.destinoTipo)?.label}
• Ascensor: ${formData.destinoAscensor ? 'Sí' : 'No'}

*Detalles:*
• Tipo de mudanza: ${mudanzaOptions.find(o => o.value === formData.tipoMudanza)?.label}
• Fecha tentativa: ${formData.fechaTentativa || 'Por definir'}
• Descripción: ${formData.descripcion || 'Sin descripción adicional'}`;

    // Simulate delay then open WhatsApp
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const whatsappUrl = `https://wa.me/56991421929?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

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
            <p className="text-muted-foreground mb-6">
              Se abrió WhatsApp con tu cotización. Si no se abrió automáticamente, 
              haz clic en el botón de abajo.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => {
                  const message = `Hola, solicito cotización de mudanza.`;
                  window.open(`https://wa.me/56991421929?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                Abrir WhatsApp
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsSubmitted(false);
                  setCurrentStep(1);
                  setFormData(initialFormData);
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
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Cotización Online
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
            Solicita tu presupuesto gratis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Completa el formulario en simples pasos y te contactaremos con un presupuesto personalizado.
          </p>
        </div>

        {/* Progress steps */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive 
                          ? 'bg-cta-gradient text-primary-foreground shadow-cta' 
                          : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted text-muted-foreground'
                      }`}
                      animate={{ scale: isActive ? 1.1 : 1 }}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </motion.div>
                    <span className={`text-xs mt-2 font-medium hidden sm:block ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 sm:w-24 h-1 mx-2 rounded-full transition-colors ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form card */}
        <div className="max-w-2xl mx-auto">
          <motion.div 
            className="bg-card rounded-3xl p-8 md:p-10 shadow-card"
            layout
          >
            <AnimatePresence mode="wait">
              {/* Step 1: Contact Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-heading font-semibold text-foreground">
                      Datos de Contacto
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nombre">Nombre completo *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => updateField('nombre', e.target.value)}
                        placeholder="Ej: Juan Pérez"
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
                      <Label htmlFor="email">Correo electrónico (opcional)</Label>
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
                </motion.div>
              )}

              {/* Step 2: Origin */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-heading font-semibold text-foreground">
                      Punto de Origen
                    </h3>
                  </div>

                  <div className="space-y-4">
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
                      <RadioGroup
                        value={formData.origenTipo}
                        onValueChange={(value) => updateField('origenTipo', value)}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2"
                      >
                        {viviendaOptions.map((option) => (
                          <div key={option.value} className="flex items-center">
                            <RadioGroupItem value={option.value} id={`origen-${option.value}`} className="peer sr-only" />
                            <Label
                              htmlFor={`origen-${option.value}`}
                              className="flex-1 text-center py-2 px-3 border rounded-lg cursor-pointer text-sm transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:bg-muted"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="origenAscensor"
                        checked={formData.origenAscensor}
                        onCheckedChange={(checked) => updateField('origenAscensor', checked as boolean)}
                      />
                      <Label htmlFor="origenAscensor" className="cursor-pointer">
                        Tiene ascensor
                      </Label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Destination */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-heading font-semibold text-foreground">
                      Punto de Destino
                    </h3>
                  </div>

                  <div className="space-y-4">
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
                      <RadioGroup
                        value={formData.destinoTipo}
                        onValueChange={(value) => updateField('destinoTipo', value)}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2"
                      >
                        {viviendaOptions.map((option) => (
                          <div key={option.value} className="flex items-center">
                            <RadioGroupItem value={option.value} id={`destino-${option.value}`} className="peer sr-only" />
                            <Label
                              htmlFor={`destino-${option.value}`}
                              className="flex-1 text-center py-2 px-3 border rounded-lg cursor-pointer text-sm transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:bg-muted"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="destinoAscensor"
                        checked={formData.destinoAscensor}
                        onCheckedChange={(checked) => updateField('destinoAscensor', checked as boolean)}
                      />
                      <Label htmlFor="destinoAscensor" className="cursor-pointer">
                        Tiene ascensor
                      </Label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Details */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Package className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-heading font-semibold text-foreground">
                      Detalles de la Mudanza
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Tipo de mudanza</Label>
                      <RadioGroup
                        value={formData.tipoMudanza}
                        onValueChange={(value) => updateField('tipoMudanza', value)}
                        className="grid gap-3 mt-2"
                      >
                        {mudanzaOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <div key={option.value} className="flex items-center">
                              <RadioGroupItem value={option.value} id={`mudanza-${option.value}`} className="peer sr-only" />
                              <Label
                                htmlFor={`mudanza-${option.value}`}
                                className="flex items-center gap-3 w-full py-3 px-4 border rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:bg-muted"
                              >
                                <Icon className="w-5 h-5 text-primary" />
                                <span>{option.label}</span>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                    <div>
                      <Label htmlFor="fechaTentativa">Fecha tentativa (opcional)</Label>
                      <Input
                        id="fechaTentativa"
                        type="date"
                        value={formData.fechaTentativa}
                        onChange={(e) => updateField('fechaTentativa', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="descripcion">Descripción adicional (opcional)</Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => updateField('descripcion', e.target.value)}
                        placeholder="Describe brevemente qué muebles o artículos principales tienes, si hay objetos delicados, pianos, cajas fuertes, etc."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
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

              {currentStep < 4 ? (
                <Button onClick={nextStep} className="bg-cta-gradient text-primary-foreground gap-2">
                  Siguiente
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
                      Enviar por WhatsApp
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

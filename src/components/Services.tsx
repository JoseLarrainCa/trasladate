import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Building2, Package, Warehouse, Truck, Piano, Star, ChevronDown, Check, Send } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const mudanzaHogarPlans = [
  {
    name: 'Express',
    items: [
      'Camión Cerrado',
      'Chofer',
      'Ayudantes para cargar en casa, dpto ó bodega',
      'Descargar en casa, dpto ó bodega destino',
    ],
  },
  {
    name: 'Principal',
    items: [
      'Camión Cerrado',
      'Chofer',
      'Ayudantes para embalar TODOS los muebles grandes de su casa o dpto',
      'Cargar al camión en casa o dpto',
      'Descargar desde el camión en casa ó dpto destino',
    ],
  },
  {
    name: 'Exclusivo',
    items: [
      'Camión Cerrado',
      'Chofer',
      'Ayudantes para embalar absolutamente TODO lo existente en su casa o dpto',
      'Cargar todo en casa o dpto origen',
      'Descargar todo en casa, dpto ó bodega destino',
    ],
  },
];

const trasladosEspeciales = [
  'Movimiento y Traslado de Caja Fuerte',
  'Movimiento y Traslado de Piano Vertical',
  'Embalaje y Traslados de Obras de Arte',
  'Embalaje y Traslado de Instrumentos',
  'Embalaje y Traslado de Equipos de Laboratorio',
];

const services = [
  {
    icon: Home,
    title: 'Mudanza del Hogar',
    description: 'Mediante la información brindada, le ofrecemos distintos servicios adaptados a sus necesidades.',
    expandable: 'plans' as const,
  },
  {
    icon: Building2,
    title: 'Mudanza de Oficina',
    description: 'Concretamos el servicio de mudanza de oficinas en tu lugar de trabajo con eficiencia.',
    expandable: 'office' as const,
  },
  {
    icon: Star,
    title: 'Exclusividad',
    description: 'Lo exclusivo, requiere un servicio exclusivo. Atención personalizada para clientes exigentes.',
    expandable: false as const,
  },
  {
    icon: Piano,
    title: 'Traslados Especiales',
    description: 'Caja fuerte, piano de cola, instrumentos musicales, obras de arte y otros objetos delicados.',
    expandable: 'list' as const,
  },
  {
    icon: Truck,
    title: 'Transporte Nacional',
    description: 'Recorremos desde Arica hasta Punta Arenas. Cobertura en todo Chile.',
    expandable: false as const,
  },
  {
    icon: Warehouse,
    title: 'Minibodegas',
    description: 'Almacenamiento seguro para tus pertenencias mientras decides tu próximo paso.',
    expandable: false as const,
  },
];

const Services = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="servicios" className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div ref={ref} className={`text-center mb-16 scroll-animate ${isVisible ? 'visible' : ''}`}>
          <motion.span
            className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Nuestros Servicios
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
            Soluciones completas para tu mudanza
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ofrecemos un servicio integral para empresas y particulares, 
            siempre enfocados en entregar la mejor calidad para tu tranquilidad.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

interface ServiceCardProps {
  service: typeof services[0];
  index: number;
}

const ServiceCard = ({ service, index }: ServiceCardProps) => {
  const { ref, isVisible } = useScrollAnimation(0.2);
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = service.icon;

  return (
    <motion.div
      ref={ref}
      className={`scroll-animate ${isVisible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <motion.div
        className={`group bg-card rounded-2xl p-8 shadow-soft hover:shadow-card transition-all duration-500 h-full border border-transparent hover:border-primary/20 ${
          service.expandable ? 'cursor-pointer' : ''
        }`}
        whileHover={{ y: -8 }}
        onClick={() => service.expandable && setIsExpanded(!isExpanded)}
      >
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cta-gradient group-hover:shadow-cta transition-all duration-500">
          <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
            {service.title}
          </h3>
          {service.expandable && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5 text-primary" />
            </motion.div>
          )}
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {service.description}
        </p>

        {/* Expandable content */}
        <AnimatePresence>
          {service.expandable && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-6 border-t border-border pt-5">
                {service.expandable === 'plans' && (
                  <div className="space-y-5">
                    {mudanzaHogarPlans.map((plan) => (
                      <div key={plan.name}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-heading font-semibold text-foreground text-lg flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {plan.name}
                          </h4>
                          <a
                            href="#cotizacion"
                            className="inline-flex items-center gap-1 bg-cta-gradient text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-cta hover:opacity-90 transition-opacity uppercase tracking-wide"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Cotiza Ahora
                          </a>
                        </div>
                        <ul className="space-y-1.5 pl-4">
                          {plan.items.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                {service.expandable === 'list' && (
                  <ul className="space-y-2">
                    {trasladosEspeciales.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {service.expandable === 'office' && (
                  <OfficeExpandable />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const OfficeExpandable = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ nombre: '', celular: '', correo: '', direccion: '', mensaje: '' });
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.celular.trim() || !form.correo.trim()) {
      toast({ title: 'Completa los campos requeridos', variant: 'destructive' });
      return;
    }
    setSending(true);
    const msg = encodeURIComponent(
      `*Consulta Mudanza de Oficina*\n\nNombre: ${form.nombre}\nCelular: ${form.celular}\nCorreo: ${form.correo}\nDirección: ${form.direccion}\nMensaje: ${form.mensaje}`
    );
    window.open(`https://wa.me/56990040399?text=${msg}`, '_blank');
    setSending(false);
    toast({ title: '¡Mensaje enviado!', description: 'Nos pondremos en contacto contigo pronto.' });
    setForm({ nombre: '', celular: '', correo: '', direccion: '', mensaje: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <p className="text-muted-foreground leading-relaxed text-sm">
        Concretamos cada servicio con una <span className="text-foreground font-medium">visita técnica presencial</span> de nuestro ejecutivo, 
        quien evalúa in situ las necesidades de su empresa para entregarle una cotización precisa y sin sorpresas.
      </p>
      <p className="text-muted-foreground leading-relaxed text-sm">
        Además, programamos su mudanza en <span className="text-foreground font-medium">horario nocturno, fines de semana o feriados</span>, 
        para que su operación no se detenga ni un solo minuto.
      </p>

      {!showForm ? (
        <Button
          className="bg-cta-gradient text-primary-foreground shadow-cta hover:opacity-90 w-full mt-2"
          onClick={() => setShowForm(true)}
        >
          <Send className="w-4 h-4 mr-2" />
          Solicitar Visita Técnica
        </Button>
      ) : (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 rounded-xl bg-secondary/10 border border-secondary/20 p-5 space-y-4"
          onSubmit={handleSubmit}
        >
          <h4 className="font-heading font-semibold text-foreground text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Solicitar Visita Técnica
          </h4>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wide">Nombre *</label>
            <Input
              placeholder="Tu nombre completo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              maxLength={100}
              required
              className="bg-background/80 border-secondary/20 focus-visible:ring-primary"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wide">Celular *</label>
              <Input
                placeholder="+56 9 1234 5678"
                type="tel"
                value={form.celular}
                onChange={(e) => setForm({ ...form, celular: e.target.value })}
                maxLength={20}
                required
                className="bg-background/80 border-secondary/20 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wide">Correo *</label>
              <Input
                placeholder="correo@ejemplo.com"
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                maxLength={255}
                required
                className="bg-background/80 border-secondary/20 focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wide">Dirección</label>
            <Input
              placeholder="Dirección de la oficina"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              maxLength={200}
              className="bg-background/80 border-secondary/20 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wide">Mensaje</label>
            <Textarea
              placeholder="Cuéntanos sobre tu mudanza..."
              value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              maxLength={500}
              rows={3}
              className="bg-background/80 border-secondary/20 focus-visible:ring-primary"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              className="bg-cta-gradient text-primary-foreground shadow-cta hover:opacity-90 flex-1"
              disabled={sending}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar por WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-secondary/30 hover:bg-secondary/10"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </motion.form>
      )}
    </div>
  );
};

export default Services;

import { motion } from 'framer-motion';
import { Home, Building2, Package, Warehouse, Truck, Piano, Star } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const services = [
  {
    icon: Home,
    title: 'Mudanza del Hogar',
    description: 'Mediante la información brindada, le ofrecemos distintos servicios adaptados a sus necesidades.',
  },
  {
    icon: Building2,
    title: 'Mudanza de Oficina',
    description: 'Concretamos el servicio de mudanza de oficinas en tu lugar de trabajo con eficiencia.',
  },
  {
    icon: Star,
    title: 'Exclusividad',
    description: 'Lo exclusivo, requiere un servicio exclusivo. Atención personalizada para clientes exigentes.',
  },
  {
    icon: Piano,
    title: 'Traslados Especiales',
    description: 'Caja fuerte, piano de cola, instrumentos musicales, obras de arte y otros objetos delicados.',
  },
  {
    icon: Truck,
    title: 'Transporte Nacional',
    description: 'Recorremos desde Arica hasta Punta Arenas. Cobertura en todo Chile.',
  },
  {
    icon: Warehouse,
    title: 'Minibodegas',
    description: 'Almacenamiento seguro para tus pertenencias mientras decides tu próximo paso.',
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
  const Icon = service.icon;

  return (
    <motion.div
      ref={ref}
      className={`scroll-animate ${isVisible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <motion.div
        className="group bg-card rounded-2xl p-8 shadow-soft hover:shadow-card transition-all duration-500 h-full border border-transparent hover:border-primary/20"
        whileHover={{ y: -8 }}
      >
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cta-gradient group-hover:shadow-cta transition-all duration-500">
          <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
        </div>
        <h3 className="text-xl font-heading font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
          {service.title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {service.description}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Services;

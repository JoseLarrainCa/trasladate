import { motion } from 'framer-motion';
import { Home, Building2, Package, Warehouse, Truck, Users } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const services = [
  {
    icon: Home,
    title: 'Mudanzas Residenciales',
    description: 'Casas, departamentos y condominios. Cuidamos cada detalle de tu hogar.',
  },
  {
    icon: Building2,
    title: 'Mudanzas de Oficinas',
    description: 'Traslado empresarial eficiente, minimizando tiempos de inactividad.',
  },
  {
    icon: Package,
    title: 'Embalaje Profesional',
    description: 'Protección de muebles, loza, electrodomésticos y objetos delicados.',
  },
  {
    icon: Warehouse,
    title: 'Bodegaje',
    description: 'Almacenamiento seguro temporal o permanente para tus pertenencias.',
  },
  {
    icon: Truck,
    title: 'Fletes y Cargas',
    description: 'Transporte de carga general a nivel nacional con seguimiento.',
  },
  {
    icon: Users,
    title: 'Ayudantes',
    description: 'Personal calificado para carga, descarga y organización de bienes.',
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

import { motion } from 'framer-motion';
import { Truck, Package, Scale, MapPin } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import fleetImage from '@/assets/fleet.jpg';

const truckTypes = [
  { capacity: '10 m³', weight: '2 ton', description: 'Ideal para estudios y departamentos pequeños' },
  { capacity: '20 m³', weight: '4 ton', description: 'Perfecto para departamentos medianos' },
  { capacity: '30 m³', weight: '6 ton', description: 'Casas pequeñas y oficinas' },
  { capacity: '50 m³', weight: '10 ton', description: 'Casas grandes y empresas' },
  { capacity: '90 m³', weight: '28 ton', description: 'Mudanzas industriales y cargas pesadas' },
];

const Fleet = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation();

  return (
    <section id="flota" className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 opacity-5">
        <img src={fleetImage} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div ref={headerRef} className={`text-center mb-16 scroll-animate ${headerVisible ? 'visible' : ''}`}>
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Nuestra Flota
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
            Camiones para cada necesidad
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Contamos con camiones cerrados, planos, ramplas y barandas. 
            Flota propia con capacidades desde 2 hasta 28 toneladas.
          </p>
        </div>

        {/* Stats */}
        <div ref={gridRef} className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 scroll-animate ${gridVisible ? 'visible' : ''}`}>
          {[
            { icon: Truck, value: '15+', label: 'Camiones' },
            { icon: Package, value: '90 m³', label: 'Capacidad máx.' },
            { icon: Scale, value: '28 ton', label: 'Carga máx.' },
            { icon: MapPin, value: 'Nacional', label: 'Cobertura' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="bg-card rounded-2xl p-6 text-center shadow-soft hover:shadow-card transition-all"
                whileHover={{ y: -4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={gridVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1 }}
              >
                <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-heading font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Truck types */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {truckTypes.map((truck, index) => (
            <motion.div
              key={truck.capacity}
              className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all group"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={gridVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-cta-gradient transition-all">
                  <Truck className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div>
                  <p className="text-xl font-heading font-bold text-foreground">{truck.capacity}</p>
                  <p className="text-sm text-muted-foreground">{truck.weight}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{truck.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Fleet;

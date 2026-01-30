import { motion } from 'framer-motion';
import { Shield, Clock, Award, Heart } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import moversTeam from '@/assets/movers-team.jpg';

const values = [
  { icon: Shield, label: 'Garantía', description: 'Protección total de tus bienes' },
  { icon: Clock, label: 'Rapidez', description: 'Cumplimos con los tiempos acordados' },
  { icon: Award, label: 'Confianza', description: 'Más de 25 años de experiencia' },
  { icon: Heart, label: 'Compromiso', description: 'Cuidamos tu mudanza como propia' },
];

const About = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation();

  return (
    <section id="nosotros" className="py-20 md:py-28 bg-muted/50 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image side */}
          <div ref={imageRef} className={`scroll-animate-left ${imageVisible ? 'visible' : ''}`}>
            <div className="relative">
              <motion.div
                className="absolute -inset-4 bg-cta-gradient rounded-3xl opacity-20 blur-2xl"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className="relative rounded-2xl overflow-hidden shadow-card">
                <img 
                  src={moversTeam} 
                  alt="Equipo de Mudanzas Nicolás Lagos trabajando" 
                  className="w-full h-[400px] md:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-primary-foreground font-heading font-bold text-2xl">
                    "Transportamos tus sueños a un futuro diferente"
                  </p>
                </div>
              </div>
              
              {/* Floating badge */}
              <motion.div
                className="absolute -bottom-6 -right-6 bg-card rounded-2xl p-6 shadow-card"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <p className="text-4xl font-heading font-bold text-primary">25+</p>
                <p className="text-sm text-muted-foreground">Años de experiencia</p>
              </motion.div>
            </div>
          </div>

          {/* Content side */}
          <div>
            <div ref={headerRef} className={`scroll-animate ${headerVisible ? 'visible' : ''}`}>
              <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
                Quiénes Somos
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
                Una empresa familiar con tradición
              </h2>
            </div>

            <div ref={contentRef} className={`scroll-animate ${contentVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.2s' }}>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Somos una empresa familiar dedicada al transporte de mudanzas y cargas en general. 
                Nuestros años de experiencia en el mercado nos han posicionado como una de las 
                empresas más reconocidas dentro del rubro.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Nuestra misión es ser la mejor empresa de mudanzas y brindar a cada uno de 
                nuestros clientes la mejor atención del mercado. Llegamos a todo Chile con 
                cobertura nacional.
              </p>

              {/* Values grid */}
              <div className="grid grid-cols-2 gap-4">
                {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <motion.div
                      key={value.label}
                      className="bg-card rounded-xl p-4 shadow-soft hover:shadow-card transition-all group"
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={contentVisible ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Icon className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="font-heading font-semibold text-foreground">{value.label}</h4>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

import { motion } from 'framer-motion';
import { Phone, Mail, MessageCircle, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import WhatsAppContactForm from './WhatsAppContactForm';

const contactInfo = [
{
  icon: Phone,
  label: 'Teléfonos',
  values: ['+56 9 9004 0399', '+56 9 9004 0399'],
  action: 'tel:+56990040399'
},
{
  icon: Mail,
  label: 'Correos',
  values: ['contacto@trasladarte.cl'],
  action: 'mailto:contacto@trasladarte.cl'
},
{
  icon: Clock,
  label: 'Horario',
  values: ['Lunes a Sábado', '08:00 - 20:00 hrs'],
  action: null
},
{
  icon: MapPin,
  label: 'Ubicación',
  values: ['Santiago, Chile', 'Arica a Punta Arenas'],
  action: null
}];


const Contact = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="contacto" className="py-20 md:py-28 bg-muted/50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div ref={ref} className={`text-center mb-16 scroll-animate ${isVisible ? 'visible' : ''}`}>
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Contacto
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
            ¿Listo para tu mudanza?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Contáctenos para cotizar su servicio. Realizamos presupuestos gratis a todo Chile.
            Factura inmediata disponible.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            const Wrapper = info.action ? 'a' : 'div';
            const wrapperProps = info.action ? { href: info.action } : {};

            return (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + index * 0.1 }}>

                <Wrapper
                  {...wrapperProps}
                  className={`block bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all h-full ${
                  info.action ? 'cursor-pointer group' : ''}`
                  }>

                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cta-gradient group-hover:shadow-cta transition-all">
                    <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">{info.label}</h3>
                  {info.values.map((value) =>
                  <p key={value} className="text-muted-foreground text-sm">{value}</p>
                  )}
                </Wrapper>
              </motion.div>);

          })}
        </div>

        {/* Main CTA */}
        <motion.div
          className={`text-center scroll-animate ${isVisible ? 'visible' : ''}`}
          style={{ transitionDelay: '0.4s' }}>

          <div className="bg-card rounded-3xl p-8 md:p-12 shadow-card max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-4">
              Háblanos por WhatsApp
            </h3>
            <p className="text-muted-foreground mb-6">
              Respuesta inmediata. Cuéntanos sobre tu mudanza y te enviamos un presupuesto sin compromiso.
            </p>
            <Button
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all font-semibold text-lg px-10"
              asChild>

              <motion.a
                href="https://wa.me/56990040399"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>

                <MessageCircle className="mr-2 w-5 h-5" />
                Escribir por WhatsApp
              </motion.a>
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-8">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                O envíanos un mensaje
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <WhatsAppContactForm />
          </div>
        </motion.div>
      </div>
    </section>);

};

export default Contact;
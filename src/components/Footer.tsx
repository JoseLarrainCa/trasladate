import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cta-gradient rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold">T</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">Trasladarte</h3>
                <p className="text-sm text-secondary-foreground/70">La Gran Aventura de Mudarte</p>
              </div>
            </div>
            <p className="text-secondary-foreground/80 max-w-md">
              Expertos en mudanzas residenciales, de oficinas y traslados especiales. 
              Cobertura desde Arica hasta Punta Arenas con presupuestos gratuitos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2">
              {['Inicio', 'Servicios', 'Nosotros', 'Flota', 'Contacto'].map((item) => (
                <li key={item}>
                  <a 
                    href={`#${item.toLowerCase()}`}
                    className="text-secondary-foreground/70 hover:text-primary transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-secondary-foreground/70">
                <Phone className="w-4 h-4 text-primary" />
                <a href="tel:+56226436664" className="hover:text-primary transition-colors">
                  +56 2 2643 6664
                </a>
              </li>
              <li className="flex items-center gap-2 text-secondary-foreground/70">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:contacto@trasladarte.cl" className="hover:text-primary transition-colors text-sm">
                  contacto@trasladarte.cl
                </a>
              </li>
              <li className="flex items-center gap-2 text-secondary-foreground/70">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Santiago, Chile</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-secondary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary-foreground/60">
          <p>© {currentYear} Trasladarte Mudanzas. Todos los derechos reservados.</p>
          <p>
            Nuestros principios: <span className="text-primary">Soluciones, Garantías, Rapidez, Confianza</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

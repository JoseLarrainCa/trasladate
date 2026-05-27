import { useState, useEffect, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Menu, X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo-trasladarte.png';
import MiniBodegas from '@/components/MiniBodegas';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [showMiniBodegas, setShowMiniBodegas] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track which section is visible
  useEffect(() => {
    const sectionIds = ['inicio', 'servicios', 'nosotros', 'flota', 'galeria', 'cotizacion', 'contacto'];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: '-30% 0px -60% 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const navItems = [
    { label: 'Servicios', href: '#servicios' },
    { label: 'Nosotros', href: '#nosotros' },
    { label: 'Galería', href: '#galeria' },
    { label: 'Flota', href: '#flota' },
    { label: 'Cotización', href: '#cotizacion' },
    { label: 'Contacto', href: '#contacto' },
  ];

  const handleSectionClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const sectionId = href.replace('#', '');
    const element = document.getElementById(sectionId);

    event.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname !== '/') {
      navigate(`/${href}`);
      return;
    }

    window.history.pushState(null, '', href);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* Top bar */}
      <div className="bg-secondary text-secondary-foreground py-2 px-4">
        <div className="container mx-auto flex flex-wrap justify-between items-center text-sm gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <a href="tel:+56990040399" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              <span>+56 9 9004 0399</span>
            </a>
            <a href="tel:+56990040399" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">+56 9 9004 0399</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-primary-foreground/80 hidden sm:inline">La Gran Aventura de Mudarte</span>
            <Link
              to="/login"
              className="flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground transition-colors font-medium"
            >
              <LogIn className="w-4 h-4" />
              Panel Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <motion.header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-card/95 backdrop-blur-md shadow-soft' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.a
              href="/#inicio"
              onClick={(event) => handleSectionClick(event, '#inicio')}
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <img src={logo} alt="Trasladarte" className="h-12 w-auto object-contain" />
              <div>
                <h1 className="font-heading font-bold text-xl text-foreground">Trasladarte</h1>
                <p className="text-xs text-muted-foreground">La Gran Aventura de Mudarte</p>
              </div>
            </motion.a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => {
                const isActive = activeSection === item.href.slice(1);
                return (
                  <motion.a
                    key={item.label}
                    href={`/${item.href}`}
                    onClick={(event) => handleSectionClick(event, item.href)}
                    className={`font-medium transition-colors relative group ${
                      isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                    }`}
                    whileHover={{ y: -2 }}
                  >
                    {item.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </motion.a>
                );
              })}
              {/* Mini Bodegas - opens dialog */}
              <motion.button
                onClick={() => setShowMiniBodegas(true)}
                className="font-medium transition-colors relative group text-foreground hover:text-primary"
                whileHover={{ y: -2 }}
              >
                Mini Bodegas
                <span className="absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 w-0 group-hover:w-full" />
              </motion.button>
            </nav>

            {/* CTA Button */}
            <div className="hidden lg:block">
              <Button 
                className="bg-cta-gradient text-primary-foreground shadow-cta hover:opacity-90 transition-opacity font-semibold"
                asChild
              >
              <a href="https://wa.me/56990040399" target="_blank" rel="noopener noreferrer">
                Cotizar Ahora
              </a>
            </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="lg:hidden bg-card border-t border-border"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
                {navItems.map((item) => {
                  const isActive = activeSection === item.href.slice(1);
                  return (
                    <a
                      key={item.label}
                      href={`/${item.href}`}
                      className={`font-medium transition-colors py-2 ${
                        isActive ? 'text-primary' : 'text-foreground hover:text-primary'
                      }`}
                      onClick={(event) => handleSectionClick(event, item.href)}
                    >
                      {item.label}
                    </a>
                  );
                })}
                {/* Mini Bodegas - opens dialog */}
                <button
                  className="font-medium transition-colors py-2 text-foreground hover:text-primary text-left"
                  onClick={() => { setShowMiniBodegas(true); setIsMobileMenuOpen(false); }}
                >
                  Mini Bodegas
                </button>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 font-medium text-foreground hover:text-primary py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  Panel Admin
                </Link>
                <Button 
                  className="bg-cta-gradient text-primary-foreground w-full mt-2"
                  asChild
                >
                  <a href="https://wa.me/56990040399" target="_blank" rel="noopener noreferrer">
                    Cotizar Ahora
                  </a>
                </Button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      <MiniBodegas open={showMiniBodegas} onOpenChange={setShowMiniBodegas} />
    </>
  );
};

export default Header;

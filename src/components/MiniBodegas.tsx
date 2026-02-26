import { Warehouse, Globe, Phone, Mail, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MiniBodegasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MiniBodegas = ({ open, onOpenChange }: MiniBodegasProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-3">
            <Warehouse className="w-7 h-7 text-primary" />
            <span>Mini Bodegas</span>
          </DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-center">
          Convenio con una de las más grandes empresas de Mini-bodegas, contando con{' '}
          <span className="text-foreground font-semibold">24 Sucursales en la Región Metropolitana</span> y{' '}
          <span className="text-foreground font-semibold">1 en Viña del Mar</span>.
        </p>

        <div className="bg-secondary/30 rounded-xl p-5 mt-2">
          <h3 className="font-heading font-semibold text-foreground text-center mb-4">
            Contacto <span className="text-primary">akikb</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <a href="https://www.akikb.cl" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Globe className="w-4 h-4 text-primary flex-shrink-0" />
              www.akikb.cl
            </a>
            <a href="https://wa.me/56990693638" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
              +56 990 693 638
            </a>
            <a href="tel:222000555" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
              222 000 555
            </a>
            <a href="mailto:minibodegas@akikb.cl" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
              minibodegas@akikb.cl
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MiniBodegas;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendToFormspree } from '@/lib/formspree';

const WhatsAppContactForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [data, setData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: '',
  });

  const update = (k: keyof typeof data, v: string) =>
    setData((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.nombre.trim() || !data.email.trim() || !data.mensaje.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Completa nombre, correo y mensaje.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const ok = await sendToFormspree({
      _subject: `Nuevo contacto desde la web — ${data.nombre}`,
      tipo: 'Consulta rápida (sección WhatsApp)',
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      mensaje: data.mensaje,
    });
    setIsSubmitting(false);

    if (ok) {
      setIsSent(true);
      toast({
        title: '¡Mensaje enviado!',
        description: 'Te contactaremos a la brevedad.',
      });
    } else {
      toast({
        title: 'Error al enviar',
        description: 'Intenta nuevamente o escríbenos por WhatsApp.',
        variant: 'destructive',
      });
    }
  };

  if (isSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-500" />
        </div>
        <h4 className="font-heading font-semibold text-foreground mb-2">
          ¡Mensaje enviado!
        </h4>
        <p className="text-sm text-muted-foreground">
          Recibimos tu consulta. Te responderemos pronto.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="wa-nombre">Nombre *</Label>
          <Input
            id="wa-nombre"
            value={data.nombre}
            onChange={(e) => update('nombre', e.target.value)}
            placeholder="Tu nombre"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="wa-telefono">Teléfono</Label>
          <Input
            id="wa-telefono"
            type="tel"
            value={data.telefono}
            onChange={(e) => update('telefono', e.target.value)}
            placeholder="+56 9 ..."
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="wa-email">Correo *</Label>
        <Input
          id="wa-email"
          type="email"
          value={data.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="correo@ejemplo.cl"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="wa-mensaje">Mensaje *</Label>
        <Textarea
          id="wa-mensaje"
          value={data.mensaje}
          onChange={(e) => update('mensaje', e.target.value)}
          placeholder="Cuéntanos brevemente sobre tu mudanza..."
          rows={4}
          className="mt-1"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full bg-cta-gradient hover:opacity-90 text-primary-foreground shadow-cta font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 w-5 h-5 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="mr-2 w-5 h-5" />
            Enviar consulta
          </>
        )}
      </Button>
    </form>
  );
};

export default WhatsAppContactForm;

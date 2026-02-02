import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Building2,
  Calendar,
  Package,
  MessageSquare,
  Trash2,
  Loader2,
  Save,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { QuoteWithItems, QuoteStatus, QuoteItem } from '@/types/database';

const viviendaLabels: Record<string, string> = {
  departamento: 'Departamento',
  'casa-1': 'Casa 1 piso',
  'casa-2': 'Casa 2+ pisos',
  oficina: 'Oficina',
  bodega: 'Bodega',
};

const mudanzaLabels: Record<string, string> = {
  hogar: 'Mudanza del Hogar',
  oficina: 'Mudanza de Oficina',
  especial: 'Traslado Especial',
};

const statusOptions: { value: QuoteStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'cotizado', label: 'Cotizado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const FormularioDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quote, setQuote] = useState<QuoteWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus>('pendiente');

  useEffect(() => {
    if (id) {
      fetchQuote(id);
    }
  }, [id]);

  const fetchQuote = async (quoteId: string) => {
    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError) {
      console.error('Error fetching quote:', quoteError);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la cotización',
        variant: 'destructive',
      });
      navigate('/admin/formularios');
      return;
    }

    const { data: itemsData } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('category', { ascending: true });

    setQuote({
      ...quoteData,
      quote_items: itemsData || [],
    });
    setSelectedStatus(quoteData.estado);
    setIsLoading(false);
  };

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    if (!quote) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('quotes')
      .update({ estado: newStatus })
      .eq('id', quote.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    } else {
      setQuote({ ...quote, estado: newStatus });
      setSelectedStatus(newStatus);
      toast({
        title: 'Estado actualizado',
        description: `La cotización ahora está "${statusOptions.find(s => s.value === newStatus)?.label}"`,
      });
    }
    setIsSaving(false);
  };

  const handleAddNote = async () => {
    if (!quote || !newNote.trim()) return;

    setIsSaving(true);
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");
    const updatedNotes = quote.notas_internas
      ? `${quote.notas_internas}\n• ${timestamp} - ${newNote.trim()}`
      : `• ${timestamp} - ${newNote.trim()}`;

    const { error } = await supabase
      .from('quotes')
      .update({ notas_internas: updatedNotes })
      .eq('id', quote.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar la nota',
        variant: 'destructive',
      });
    } else {
      setQuote({ ...quote, notas_internas: updatedNotes });
      setNewNote('');
      toast({
        title: 'Nota agregada',
      });
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!quote) return;

    setIsDeleting(true);
    const { error } = await supabase.from('quotes').delete().eq('id', quote.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la cotización',
        variant: 'destructive',
      });
      setIsDeleting(false);
    } else {
      toast({
        title: 'Cotización eliminada',
      });
      navigate('/admin/formularios');
    }
  };

  const handleSendWhatsApp = () => {
    if (!quote) return;

    const message = `*Cotización de Mudanza*

*Cliente:* ${quote.cliente_nombre} ${quote.cliente_apellido || ''}
*Teléfono:* ${quote.telefono}

*Origen:* ${quote.origen_direccion}, ${quote.origen_comuna}
*Destino:* ${quote.destino_direccion}, ${quote.destino_comuna}

*Tipo:* ${mudanzaLabels[quote.tipo_mudanza]}
*Fecha:* ${quote.fecha_traslado ? format(new Date(quote.fecha_traslado), 'dd/MM/yyyy') : 'Por definir'}`;

    const url = `https://wa.me/${quote.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Group items by category
  const groupedItems = quote?.quote_items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, QuoteItem[]>) || {};

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!quote) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cotización no encontrada</p>
          <Button asChild className="mt-4">
            <Link to="/admin/formularios">Volver</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/formularios">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground">
                Cotización #{quote.id.slice(0, 8)}
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(quote.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedStatus}
              onValueChange={(value) => handleStatusChange(value as QuoteStatus)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Client Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        >
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Datos del Cliente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">
                {quote.cliente_nombre} {quote.cliente_apellido}
                {quote.cliente_razon_social && ` (${quote.cliente_razon_social})`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {quote.telefono}
                {quote.celular && ` / ${quote.celular}`}
              </p>
            </div>
            {quote.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {quote.email}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Origin & Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 shadow-sm border border-border"
          >
            <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              Origen
            </h2>
            <div className="space-y-2">
              <p className="font-medium">{quote.origen_direccion}</p>
              <p className="text-muted-foreground">{quote.origen_comuna}</p>
              <div className="flex items-center gap-2 text-sm">
                <Home className="w-4 h-4" />
                {viviendaLabels[quote.origen_tipo_vivienda]}
                {quote.origen_piso && `, Piso ${quote.origen_piso}`}
              </div>
              <p className="text-sm">
                Ascensor: {quote.origen_tiene_ascensor ? 'Sí' : 'No'}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl p-6 shadow-sm border border-border"
          >
            <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Destino
            </h2>
            <div className="space-y-2">
              <p className="font-medium">{quote.destino_direccion}</p>
              <p className="text-muted-foreground">{quote.destino_comuna}</p>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4" />
                {viviendaLabels[quote.destino_tipo_vivienda]}
                {quote.destino_piso && `, Piso ${quote.destino_piso}`}
              </div>
              <p className="text-sm">
                Ascensor: {quote.destino_tiene_ascensor ? 'Sí' : 'No'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        >
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Detalles del Traslado
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de mudanza</p>
              <p className="font-medium">{mudanzaLabels[quote.tipo_mudanza]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha tentativa</p>
              <p className="font-medium">
                {quote.fecha_indefinida
                  ? 'Por definir'
                  : quote.fecha_traslado
                  ? format(new Date(quote.fecha_traslado), 'dd/MM/yyyy')
                  : 'No especificada'}
              </p>
            </div>
          </div>
          {quote.sugerencia_adicional && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Sugerencia adicional</p>
              <p className="mt-1">{quote.sugerencia_adicional}</p>
            </div>
          )}
        </motion.div>

        {/* Inventory */}
        {Object.keys(groupedItems).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-2xl p-6 shadow-sm border border-border"
          >
            <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Inventario de Muebles
              <span className="text-sm font-normal text-muted-foreground">
                ({quote.quote_items.reduce((sum, item) => sum + item.quantity, 0)} items)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-medium text-sm text-primary mb-2 uppercase tracking-wider">
                    {category}
                  </h3>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.item_name}</span>
                        <span className="font-medium">{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        >
          <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Notas Internas
          </h2>

          {quote.notas_internas && (
            <div className="bg-muted/50 rounded-xl p-4 mb-4 whitespace-pre-wrap text-sm">
              {quote.notas_internas}
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Agregar una nota..."
              className="min-h-[80px]"
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || isSaving}
              className="shrink-0"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pb-8">
          <Button onClick={handleSendWhatsApp} variant="outline" className="gap-2">
            <Send className="w-4 h-4" />
            Enviar por WhatsApp
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminarán todos los datos de esta cotización.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FormularioDetalle;

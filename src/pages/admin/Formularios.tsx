import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/components/admin/AdminLayout';
import { db } from '@/integrations/db';
import type { Quote, QuoteStatus } from '@/types/database';

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: React.ElementType }> = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  contactado: { label: 'Contactado', color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
  cotizado: { label: 'Cotizado', color: 'bg-purple-100 text-purple-800', icon: FileCheck },
  confirmado: { label: 'Confirmado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completado: { label: 'Completado', color: 'bg-green-200 text-green-900', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

interface Contacto {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  servicio: string | null;
  comuna: string | null;
  mensaje: string | null;
  origen: string | null;
  atendido: boolean;
  created_at: string;
}

const Formularios = () => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchQuotes();
    fetchContactos();

    // Antes llegaba en tiempo real desde Supabase; ahora se vuelve a leer cada 30 segundos.
    const intervalo = window.setInterval(() => {
      fetchQuotes();
      fetchContactos();
    }, 30_000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    filterQuotes();
  }, [quotes, searchTerm, statusFilter, typeFilter]);

  const fetchQuotes = async () => {
    const { data, error } = await db
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
    } else {
      setQuotes(data || []);
    }
    setIsLoading(false);
  };

  const fetchContactos = async () => {
    const { data, error } = await db.from('contactos').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching contactos:', error);
    else setContactos((data as Contacto[]) || []);
  };

  const marcarAtendido = async (c: Contacto) => {
    setContactos((prev) => prev.map((x) => (x.id === c.id ? { ...x, atendido: !c.atendido } : x)));
    const { error } = await db.from('contactos').update({ atendido: !c.atendido }).eq('id', c.id);
    if (error) fetchContactos();
  };

  const filterQuotes = () => {
    let filtered = [...quotes];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.cliente_nombre.toLowerCase().includes(term) ||
          q.cliente_apellido?.toLowerCase().includes(term) ||
          q.telefono.includes(term) ||
          q.email?.toLowerCase().includes(term) ||
          q.origen_comuna.toLowerCase().includes(term) ||
          q.destino_comuna.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((q) => q.estado === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((q) => q.tipo_mudanza === typeFilter);
    }

    setFilteredQuotes(filtered);
  };

  const getStatusBadge = (status: QuoteStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Formularios</h1>
          <p className="text-muted-foreground mt-1">
            {quotes.length} cotizaciones recibidas
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, teléfono, email o comuna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="contactado">Contactado</SelectItem>
                  <SelectItem value="cotizado">Cotizado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="hogar">Hogar</SelectItem>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="especial">Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Consultas de los formularios cortos de la página */}
        {contactos.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              Consultas de la página ({contactos.filter((c) => !c.atendido).length} sin atender)
            </h2>
            {contactos.map((c) => (
              <div
                key={c.id}
                className={`bg-card rounded-2xl p-4 shadow-sm border border-border ${c.atendido ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{c.nombre}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <a href={`https://wa.me/${c.telefono.replace(/\D/g, '')}`} className="hover:text-primary">{c.telefono}</a>
                      {c.email && <a href={`mailto:${c.email}`} className="hover:text-primary">{c.email}</a>}
                      {c.servicio && <span>{c.servicio}</span>}
                      {c.comuna && <span>{c.comuna}</span>}
                    </div>
                    {c.mensaje && <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{c.mensaje}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(c.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      {c.origen ? ` · ${c.origen}` : ''}
                    </p>
                  </div>
                  <Button variant={c.atendido ? 'outline' : 'default'} size="sm" onClick={() => marcarAtendido(c)}>
                    {c.atendido ? 'Desmarcar' : 'Marcar atendido'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quotes List */}
        <div className="space-y-3">
          {filteredQuotes.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 text-center shadow-sm border border-border">
              <p className="text-muted-foreground">
                {quotes.length === 0
                  ? 'No hay cotizaciones aún'
                  : 'No se encontraron resultados con los filtros aplicados'}
              </p>
            </div>
          ) : (
            filteredQuotes.map((quote, index) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/admin/formularios/${quote.id}`}
                  className="block bg-card rounded-2xl p-4 shadow-sm border border-border hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {quote.cliente_nombre} {quote.cliente_apellido}
                        </h3>
                        {getStatusBadge(quote.estado)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{quote.telefono}</span>
                        <span>•</span>
                        <span>
                          {quote.origen_comuna} → {quote.destino_comuna}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{quote.tipo_mudanza}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(quote.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Formularios;

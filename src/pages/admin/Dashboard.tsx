import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  MapPin,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import type { Quote } from '@/types/database';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: string;
  color?: string;
}

const StatCard = ({ title, value, description, icon: Icon, color = 'primary' }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}`} />
      </div>
    </div>
  </motion.div>
);

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    const { data, error } = await (supabase as any)
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

  // Calculate statistics
  const now = new Date();
  const thisMonth = quotes.filter((q) => {
    const created = new Date(q.created_at);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  const pendingCount = quotes.filter((q) => q.estado === 'pendiente').length;
  const completedCount = quotes.filter((q) => q.estado === 'completado').length;

  // Quotes by month (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthName = date.toLocaleDateString('es-CL', { month: 'short' });
    const count = quotes.filter((q) => {
      const created = new Date(q.created_at);
      return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
    }).length;
    return { month: monthName, cotizaciones: count };
  });

  // Quotes by type
  const typeData = [
    { name: 'Hogar', value: quotes.filter((q) => q.tipo_mudanza === 'hogar').length },
    { name: 'Oficina', value: quotes.filter((q) => q.tipo_mudanza === 'oficina').length },
    { name: 'Especial', value: quotes.filter((q) => q.tipo_mudanza === 'especial').length },
  ].filter((d) => d.value > 0);

  // Quotes by status
  const statusData = [
    { name: 'Pendiente', value: quotes.filter((q) => q.estado === 'pendiente').length },
    { name: 'Contactado', value: quotes.filter((q) => q.estado === 'contactado').length },
    { name: 'Cotizado', value: quotes.filter((q) => q.estado === 'cotizado').length },
    { name: 'Confirmado', value: quotes.filter((q) => q.estado === 'confirmado').length },
    { name: 'Completado', value: quotes.filter((q) => q.estado === 'completado').length },
    { name: 'Cancelado', value: quotes.filter((q) => q.estado === 'cancelado').length },
  ].filter((d) => d.value > 0);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Resumen de estadísticas y métricas</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Cotizaciones este mes"
            value={thisMonth.length}
            description={`Total: ${quotes.length} cotizaciones`}
            icon={FileText}
          />
          <StatCard
            title="Pendientes"
            value={pendingCount}
            description="Por atender"
            icon={Clock}
          />
          <StatCard
            title="Completadas"
            value={completedCount}
            description="Mudanzas realizadas"
            icon={CheckCircle}
          />
          <StatCard
            title="Tasa de conversión"
            value={quotes.length > 0 ? `${Math.round((completedCount / quotes.length) * 100)}%` : '0%'}
            description="Completadas / Total"
            icon={TrendingUp}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 shadow-sm border border-border"
          >
            <h3 className="font-heading font-semibold text-foreground mb-4">
              Cotizaciones por mes
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="cotizaciones" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Status Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-6 shadow-sm border border-border"
          >
            <h3 className="font-heading font-semibold text-foreground mb-4">
              Por estado
            </h3>
            <div className="h-64 flex items-center justify-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground">Sin datos</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-6 shadow-sm border border-border"
        >
          <h3 className="font-heading font-semibold text-foreground mb-4">
            Por tipo de mudanza
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: 'hogar', label: 'Mudanza del Hogar', icon: Package },
              { type: 'oficina', label: 'Mudanza de Oficina', icon: MapPin },
              { type: 'especial', label: 'Traslado Especial', icon: TrendingUp },
            ].map((item) => {
              const count = quotes.filter((q) => q.tipo_mudanza === item.type).length;
              const percentage = quotes.length > 0 ? Math.round((count / quotes.length) * 100) : 0;
              const Icon = item.icon;

              return (
                <div
                  key={item.type}
                  className="bg-muted/50 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{percentage}% del total</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;

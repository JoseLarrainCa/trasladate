import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';

const Importar = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
    } else {
      toast({
        title: 'Archivo no válido',
        description: 'Por favor sube un archivo Excel (.xlsx o .xls)',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    // TODO: Implement Excel parsing and import logic
    // This will be implemented when we have the Excel structure from the user
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
    
    toast({
      title: 'Función en desarrollo',
      description: 'La importación de Excel estará disponible pronto. Necesitamos el archivo de ejemplo para configurar el mapeo.',
    });
    
    setIsProcessing(false);
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Importar Datos</h1>
          <p className="text-muted-foreground mt-1">
            Carga datos históricos desde un archivo Excel
          </p>
        </div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-card rounded-2xl p-8 shadow-sm border-2 border-dashed transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8 text-primary" />
            </div>

            {file ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setFile(null)}
                    disabled={isProcessing}
                  >
                    Cambiar archivo
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={isProcessing}
                    className="bg-cta-gradient"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Importar datos
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  Arrastra tu archivo Excel aquí
                </h3>
                <p className="text-muted-foreground mb-4">
                  o haz clic para seleccionar
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span>Seleccionar archivo</span>
                  </Button>
                </label>
              </>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">Formato requerido</p>
            <p className="text-blue-700">
              El archivo Excel debe contener columnas para: nombre del cliente, teléfono, 
              dirección origen, dirección destino, y opcionalmente inventario de muebles.
              Contacta al administrador para obtener la plantilla correcta.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Importar;

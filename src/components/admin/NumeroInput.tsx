import { useEffect, useState, type ComponentProps } from 'react';
import { Input } from '@/components/ui/input';

interface Props extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  value: number;
  onCommit: (n: number) => void;
  /** Mínimo permitido; un valor menor no se guarda y al salir del campo vuelve al último bueno. */
  min?: number;
  /** Si se deja el campo vacío, guarda este número pero deja el campo vacío mientras se escribe. */
  vacioComo?: number;
}

/**
 * Campo numérico que deja borrar y escribir de cero. El `<Input type="number">` atado directo al
 * número obliga a volver a poner el mínimo apenas se borra (no se puede cambiar el "1"). Acá el
 * texto se guarda aparte mientras se escribe y el número solo se confirma cuando es válido.
 */
const NumeroInput = ({ value, onCommit, min = 0, vacioComo, onBlur, ...rest }: Props) => {
  const [texto, setTexto] = useState(String(value));

  useEffect(() => {
    // Cambios de afuera (p. ej. "Sugerir") se reflejan, salvo que el texto ya diga lo mismo.
    setTexto((t) => {
      if (t.trim() === '') return vacioComo !== undefined && value === vacioComo ? t : String(value);
      return Number(t) === value ? t : String(value);
    });
  }, [value, vacioComo]);

  return (
    <Input
      {...rest}
      type="number"
      inputMode="numeric"
      min={min}
      value={texto}
      onChange={(e) => {
        const t = e.target.value;
        setTexto(t);
        if (t.trim() === '') {
          if (vacioComo !== undefined) onCommit(vacioComo);
          return;
        }
        const n = Number(t);
        if (Number.isFinite(n) && n >= min) onCommit(Math.trunc(n));
      }}
      onBlur={(e) => {
        setTexto(String(value));
        onBlur?.(e);
      }}
    />
  );
};

export default NumeroInput;

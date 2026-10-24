import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import NumeroInput from './NumeroInput';

const Caja = ({ min, vacioComo }: { min?: number; vacioComo?: number }) => {
  const [n, setN] = useState(1);
  return (
    <>
      <NumeroInput aria-label="n" value={n} min={min} vacioComo={vacioComo} onCommit={setN} />
      <span data-testid="valor">{n}</span>
    </>
  );
};

describe('NumeroInput', () => {
  it('deja borrar el 1 y escribir otro número', () => {
    render(<Caja min={1} />);
    const input = screen.getByLabelText('n') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: '4' } });
    expect(input.value).toBe('4');
    expect(screen.getByTestId('valor').textContent).toBe('4');
  });

  it('no guarda un número bajo el mínimo y al salir vuelve al último bueno', () => {
    render(<Caja min={1} />);
    const input = screen.getByLabelText('n') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0' } });
    expect(screen.getByTestId('valor').textContent).toBe('1');
    fireEvent.blur(input);
    expect(input.value).toBe('1');
  });

  it('con vacioComo guarda 0 pero deja el campo vacío', () => {
    render(<Caja min={0} vacioComo={0} />);
    const input = screen.getByLabelText('n') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByTestId('valor').textContent).toBe('0');
    expect(input.value).toBe('');
  });
});

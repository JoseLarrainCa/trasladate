// Sesión del panel. Antes era Supabase Auth; ahora es la cookie que pone el Worker
// (POST /api/auth/login) y que el navegador manda sola en cada consulta. Las pantallas
// siguen usando `user`, `profile`, `signIn` y `signOut` con la misma forma de antes.
import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { db, EVENTO_SESION_VENCIDA } from '@/integrations/db';
import type { Profile } from '@/types/database';

export interface Usuario {
  id: string;
  email: string;
  role: string;
}

interface ErrorEntrada {
  message: string;
  status?: number;
}

interface AuthContextType {
  user: Usuario | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: ErrorEntrada | null }>;
  signOut: () => Promise<void>;
  /** Vuelve a leer el perfil (después de cambiar el nombre en Configuración). */
  refreshProfile: () => Promise<void>;
  /** Consulta la sesión al servidor (una sola vez). La llaman las rutas del panel. */
  verificarSesion: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function leerPerfil(userId: string): Promise<Profile | null> {
  const { data, error } = await db.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) {
    console.error('Error al leer el perfil:', error);
    return null;
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const revisada = useRef(false);

  // La página pública no consulta la sesión: solo las rutas del panel la piden.
  const verificarSesion = useCallback(() => {
    if (revisada.current) return;
    revisada.current = true;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const u: Usuario | null = d?.user ?? null;
        setUser(u);
        if (u) leerPerfil(u.id).then(setProfile);
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  // Si el servidor deja de reconocer la cookie en medio de una consulta, se vuelve al login.
  useEffect(() => {
    const alVencer = () => {
      setUser(null);
      setProfile(null);
    };
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencer);
    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const cuerpo = await res.json().catch(() => null);
      if (!res.ok) {
        return { error: { message: (cuerpo?.error as string) ?? 'No se pudo entrar', status: res.status } };
      }
      setUser(cuerpo.user);
      setIsLoading(false);
      leerPerfil(cuerpo.user.id).then(setProfile);
      return { error: null };
    } catch {
      return { error: { message: 'No se pudo conectar. Revisa tu internet.' } };
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) setProfile(await leerPerfil(user.id));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signIn, signOut, refreshProfile, verificarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

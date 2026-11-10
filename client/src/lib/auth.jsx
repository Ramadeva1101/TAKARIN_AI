import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, token } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ siap: false, user: null, usaha: null });

  const segarkan = useCallback(async () => {
    if (!token.get()) return setState({ siap: true, user: null, usaha: null });
    try {
      const { user, usaha } = await api('/auth/saya');
      setState({ siap: true, user, usaha });
    } catch {
      token.hapus();
      setState({ siap: true, user: null, usaha: null });
    }
  }, []);

  useEffect(() => {
    segarkan();
  }, [segarkan]);

  const masuk = async (path, body) => {
    const res = await api(path, { method: 'POST', body });
    token.set(res.token);
    await segarkan();
    return res;
  };

  const keluar = () => {
    token.hapus();
    setState({ siap: true, user: null, usaha: null });
  };

  return <AuthCtx.Provider value={{ ...state, segarkan, masuk, keluar }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

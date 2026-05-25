import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { api, mapUser } from './api';
import { router } from './routes';

export default function App() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userRes = await api.get('/users/me');
        let rulesAccepted = false;
        try {
          const agreementRes = await api.get('/agreements/me');
          if (agreementRes.data) {
            rulesAccepted = true;
          }
        } catch (e) {
          console.warn(e);
        }
        setAuth(mapUser(userRes.data, rulesAccepted));
      } catch (err) {
        console.warn(err);
        setInitialized(true);
      }
    };
    initAuth();
  }, [setAuth, setInitialized]);

  return <RouterProvider router={router} />;
}
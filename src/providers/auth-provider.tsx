import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext
} from 'react';
import { pb } from '@/lib/pocketbase';
import { useInterval } from 'usehooks-ts';
import ms from 'ms';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  verified: boolean;
  username: string;
  avatar: string;
}

interface PocketBaseContext {
  token: string;
  user: User;
  register: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  sendVerificationEmail: (email: string) => Promise<any>;
}

const fiveMinutesInMs = ms('5 minutes');
const twoMinutesInMs = ms('2 minutes');

const PocketBaseContext = createContext({});

export const PocketBaseProvider = ({ children }) => {
  const [token, setToken] = useState(pb.authStore.token);
  const [user, setUser] = useState(pb.authStore.model);

  useEffect(() => {
    return pb.authStore.onChange((token, model) => {
      setToken(token);
      setUser(model);
    });
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    return pb
      .collection('users')
      .create({ email, password, passwordConfirm: password });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    return pb.collection('users').authWithPassword(email, password);
  }, []);

  const sendVerificationEmail = useCallback(async (email: string) => {
    return pb.collection('users').requestVerification(email);
  }, []);

  const logout = useCallback(() => {
    pb.authStore.clear();
  }, []);

  const refreshSession = useCallback(async () => {
    if (!pb.authStore.isValid) return;

    const decoded = jwtDecode(token);
    const tokenExpiration = decoded?.exp as number;

    const expirationWithBuffer =
      ((decoded?.exp as number) + fiveMinutesInMs) / 1000;

    if (tokenExpiration < expirationWithBuffer) {
      await pb.collection('users').authRefresh();
    }
  }, [token]);

  useInterval(refreshSession, token ? twoMinutesInMs : null);

  return (
    <PocketBaseContext.Provider
      value={{
        token,
        user,
        register,
        login,
        logout,
        sendVerificationEmail
      }}
    >
      {children}
    </PocketBaseContext.Provider>
  );
};

export const usePocketBase = () => {
  const context = useContext(PocketBaseContext);

  if (context === undefined) {
    throw new Error('usePocketBase must be used within a PocketBaseProvider');
  }

  return context as PocketBaseContext;
};

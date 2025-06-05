import { createContext } from 'react';

type UserRole = 'admin' | 'travel' | 'ticket'; //type aliase

interface login {
  (email: string, password: string): Promise<boolean>
}

interface User {
  email: string; //required
  role: UserRole; //required
  userName?: string; //optional
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: login;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

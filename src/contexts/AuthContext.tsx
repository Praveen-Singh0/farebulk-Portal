import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';
import { USERS } from '../constants/auth';

type UserRole = 'admin' | 'travel_consultant' | 'ticket_consultant';

interface AuthContextType {
  user: {
    email: string;
    role: UserRole;
    name: string;
  } | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const login = (email: string, password: string) => {
    const user = Object.values(USERS).find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      toast({
        title: "Authentication Failed",
        description: "User does not exist or invalid credentials",
        variant: "destructive"
      });
      return false;
    }

    setUser({
      email: user.email,
      role: user.role as UserRole,
      name: user.name
    });

    // Role-based redirection
    switch (user.role) {
      case 'admin':
        navigate('/dashboard/overview');
        break;
      case 'travel_consultant':
        navigate('/dashboard/overview');
        break;
      case 'ticket_consultant':
        navigate('/dashboard/overview');
        break;
      default:
        navigate('/login');
    }

    toast({
      title: "Login Successful",
      description: `Welcome back, ${user.name}!`,
    });

    return true;
  };

  const logout = () => {
    setUser(null);
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
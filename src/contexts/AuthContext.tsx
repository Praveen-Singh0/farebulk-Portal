import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';
import axios from 'axios'
type UserRole = 'admin' | 'travel' | 'ticket';

interface User {
  email: string;
  role: UserRole;
  userName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string,) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("user authContext :", user)


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/dashboard?timestamp=${Date.now()}`, {
          withCredentials: true
        });


        console.log("verify user response:", res);

        const { email, role, userName } = res.data.user;

        if (!role) {
          throw new Error("Role missing");
        }

        setUser({ email, role, userName });

        // Optionally navigate based on role:
        // (Uncomment this only if you want auto-redirect on refresh)

        switch (role) {
          case 'admin':
            navigate('/dashboard/overview');
            break;
          case 'travel':
            navigate('/dashboard/overview/traval');
            break;
          case 'ticket':
            navigate('/dashboard/overview/ticket');
            break;
          default:
            navigate('/login');
        }


      } catch (err) {
        console.error("Verify user failed:", err);
        setUser(null);
      }
    };

    checkAuth();
  }, []);





  const login = async (email: string, password: string): Promise<boolean> => {
    try {

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      console.log("logon response :", response)

      const { user: userData, } = response.data;

      console.log("user login :", userData)

      if (!userData || !userData.role) {
        toast({
          title: 'Login failed',
          description: 'User data is missing or invalid',
          variant: 'destructive',
        });
        return false;
      }

      const { email: userEmail, role, userName } = userData;

      setUser({ email: userEmail, role, userName });

      switch (role) {
        case 'admin':
          navigate('/dashboard/overview');
          break;
        case 'travel':
          navigate('/dashboard/overview/traval');
          break;
        case 'ticket':
          navigate('/dashboard/overview/ticket');
          break;
        default:
          navigate('/login');
      }

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userName}!`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Login Error',
        description:
          error?.response?.data?.message || 'Server error during login',
        variant: 'destructive',
      });
      return false;
    }
  };



  const logout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/logout`, {}, {
        withCredentials: true,
      });
      setUser(null);
      navigate('/login');
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: 'Something went wrong during logout.',
        variant: 'destructive',
      });
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

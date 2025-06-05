import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';
import axios from 'axios'
import { AuthContext } from './auth-context-const';
type UserRole = 'admin' | 'travel' | 'ticket'; //type aliase

interface User {
  email: string; //required
  role: UserRole; //required
  userName?: string; //optional
}

interface login {
  (email: string, password: string): Promise<boolean>
}



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("user authContext :", user)


  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
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

        const currentPath = window.location.pathname;

        if (currentPath === '/' || currentPath === '/login') {
          if (['admin', 'travel', 'ticket'].includes(role)) {
            navigate('/dashboard/overview');
          }
        }



      } catch (err) {
        console.error("Verify user failed:", err);
        setUser(null);
      }
    };

    checkAuth();
  }, [navigate]);



  const login: login = async (email, password) => {
    setLoading(true)
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      const { user: userData, } = response.data;

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

      if (['admin', 'travel', 'ticket'].includes(role)) {
        navigate('/dashboard/overview');
      } else {
        navigate('/login');
      }

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userName}!`,
      });

      return true;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast({
          title: 'Login Error',
          description:
            error?.response?.data?.message || 'Server error during login',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login Error',
          description: 'Something went wrong',
          variant: 'destructive',
        });

      }
      return false;
    } finally {
      setLoading(false)
    }
  };

  const logout = async () => {
    setLoading(true)
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
      console.log(error)
      toast({
        title: 'Logout Failed',
        description: 'Something went wrong during logout.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false)
    }
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
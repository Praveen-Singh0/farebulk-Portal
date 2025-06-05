import { useState } from 'react';
import { useAuth } from '@/contexts/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafbfc] px-2">
      {/* Logo and Portal Name */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-[#9B87F5] rounded-xl h-12 flex items-center justify-center mb-4" style={{ width: '50px' }}>
          <span className="text-2xl font-bold text-white">F</span>
        </div>
        {/* <img src="/assets/img/Logo.png" alt="Logo" className="w-22 h-12" /> */}

        <span className="text-2xl font-semibold text-[#22223b]">Farebulk Portal</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-extrabold text-center text-[#22223b] mb-2">Sign in to your account</h1>
        <p className="text-center text-base text-[#6c6f7b] mb-8">Enter your credentials</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-base font-semibold text-[#22223b]">Username</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your username"
              required
              className="mt-2 text-base px-4 py-3 border border-[#e0e0e0] rounded-lg focus:border-[#9B87F5] focus:ring-2 focus:ring-[#9B87F5]/30"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-base font-semibold text-[#22223b]">Password</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="text-base px-4 py-3 border border-[#e0e0e0] rounded-lg focus:border-[#9B87F5] focus:ring-2 focus:ring-[#9B87F5]/30 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c6f7b] hover:text-[#9B87F5]"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <a href="#" className="text-sm text-[#9B87F5] hover:underline font-medium">Forgot your password?</a>
            </div>
          </div>
          <Button
            disabled={loading}
            type="submit"
            className="w-full bg-[#9B87F5] hover:bg-[#7a6ad6] text-lg font-semibold py-3 rounded-lg mt-2"
          >
            {loading ? "Please wait ..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-8 hidden text-center text-sm text-[#6c6f7b]">
          <div className="mb-1">Demo accounts:</div>
          <div>Admin: <span className="font-mono">admin@farebulk.com</span> / <span className="font-mono">admin123</span></div>
          <div>Travel Consultant: <span className="font-mono">travel@farebulk.com</span> / <span className="font-mono">travel123</span></div>
          <div>Ticket Consultant: <span className="font-mono">ticket@farebulk.com</span> / <span className="font-mono">ticket123</span></div>
        </div>
      </div>
    </div>
  );
};

export default Login; 
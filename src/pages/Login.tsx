import { useState } from 'react';
import { useAuth } from '@/contexts/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0e7ff] via-[#f5f7fa] to-[#c3cfe2] ">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl px-10 py-4 border border-white/40 relative">
       
        {/* Header */}
        <div className="flex flex-col items-center">
            <img src="/assets/img/farebulk_logo_crm.png" alt="Farebulk Logo" className="w-[10rem] mb-6   h-20 object-contain" />

          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Sign in</h1>
          <p className="text-gray-500 text-sm mt-2">Welcome back to <span className="font-semibold text-purple-600">Farebulk</span></p>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="mt-2 px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-500 bg-white/80 transition"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="px-4 py-3 pr-10 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-500 bg-white/80 transition"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="text-right mt-2">
              <a href="#" className="text-sm text-purple-600 hover:underline transition">Forgot password?</a>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white text-base font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogIn size={20} className="inline-block" />
            Sign in
          </Button>
        </form>
        {/* Divider */}
        <div className="flex items-center my-8">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-4 text-gray-400 text-xs"></span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        {/* Social login placeholder */}
        
        {/* Footer */}
        <div className="mt-10 text-center text-xs text-gray-400">
          <span>Don&apos;t have an account? <a href="#" className="text-purple-600 hover:underline">Sign up</a></span>
        </div>
      </div>
    </div>
  );
};

export default Login;
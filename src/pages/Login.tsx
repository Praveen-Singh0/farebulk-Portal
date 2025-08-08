import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/use-auth";

import {
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

const images = [
  {
    src: "/assets/img/LoginCarousel/image1.webp",
    alt: "Modern CRM Dashboard",
    title: "Advanced Analytics",
    description: "Get deep insights into your business performance",
  },
  {
    src: "/assets/img/LoginCarousel/image2.webp",
    alt: "Team Collaboration",
    title: "Team Collaboration",
    description: "Work together seamlessly with your team",
  },
  {
    src: "/assets/img/LoginCarousel/image3.webp",
    alt: "Customer Management",
    title: "Customer Management",
    description: "Manage all your customer relationships in one place",
  },
  {
    src: "/assets/img/LoginCarousel/image4.webp",
    alt: "Sales Pipeline",
    title: "Sales Pipeline",
    description: "Track and optimize your sales process",
  },
];

const Login = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

 
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 w-full h-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="wave-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave-gradient)"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,117.3C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0;50 0;0 0"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
          <path
            fill="url(#wave-gradient)"
            d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,181.3C672,181,768,203,864,213.3C960,224,1056,224,1152,213.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            opacity="0.7"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0;-30 0;0 0"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
          <path
            fill="url(#wave-gradient)"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,192C960,181,1056,171,1152,170.7C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            opacity="0.5"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0;40 0;0 0"
              dur="10s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Circles */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/10 rounded-full animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-purple-400/10 rounded-full animate-bounce"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-12 h-12 bg-cyan-400/10 rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-24 h-24 bg-indigo-400/10 rounded-full animate-bounce"
          style={{ animationDelay: "0.5s" }}
        ></div>

        {/* Floating Squares */}
        <div
          className="absolute top-60 left-1/4 w-8 h-8 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rotate-45 animate-spin"
          style={{ animationDuration: "8s" }}
        ></div>
        <div
          className="absolute bottom-60 right-1/4 w-6 h-6 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rotate-45 animate-spin"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        ></div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/3 left-0 w-32 h-32 bg-gradient-to-r from-blue-400/5 to-purple-400/5 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-1/3 right-0 w-40 h-40 bg-gradient-to-r from-purple-400/5 to-cyan-400/5 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Login Form (55% width) */}
      

        {/* Right Side - Image Carousel (45% width, full height) */}
        <div className="hidden lg:block lg:w-[40%] h-screen">
          <div className="w-full h-full">
            <div className="relative w-full h-full  overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
              {/* Main Image Container */}
              <div className="relative w-full h-full">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      index === currentSlide
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-105"
                    }`}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">{image.title}</h3>
                      <p className="text-sm opacity-90">{image.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}

              {/* Dot Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "bg-white w-6"
                        : "bg-white/50 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>

              {/* Progress Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 ease-out"
                  style={{
                    width: `${((currentSlide + 1) / images.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

          <div className="w-full lg:w-[55%] flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="w-full max-w-md mx-auto">
<div className="bg-white rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.2)] p-8 border border-gray-100">
                {/* Logo */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-2">
                      <img
                        src="/public/assets/img/farebulk_logo_crm.png" 
                        alt="Company Logo"
                        className="w-[10rem] h-auto object-contain"
                      />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Sign in
                  </h1>
                  <p className="text-gray-600">
                    Welcome back to{" "}
                    <span className="text-purple-600 font-medium">
                      Farebulk
                    </span>
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password */}
                  <div className="text-right">
                    <a
                      href="#"
                      className="text-sm text-purple-600 hover:text-purple-500 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center group"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Sign in
                  </button>
                </form>

                {/* Sign Up Link */}
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <a
                      href="#"
                      className="text-purple-600 hover:text-purple-500 font-medium transition-colors"
                    >
                      Sign up
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Login;

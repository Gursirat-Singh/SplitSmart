import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { LuWallet, LuMail, LuLock, LuEye, LuEyeOff, LuArrowRight } from 'react-icons/lu';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Left panel: Dark branding wing panel */}
      <div className="w-full md:w-1/2 bg-primary p-8 md:p-16 flex flex-col justify-between text-white relative z-10 min-h-[40vh] md:min-h-screen">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <LuWallet className="text-2xl text-white opacity-80" />
          <span className="font-bold text-lg tracking-tight text-white">SplitSmart</span>
        </div>
        
        {/* Main Headings */}
        <div className="my-auto space-y-6 max-w-lg">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">Master your shared expenses with precision.</h1>
          <p className="text-sm md:text-base text-neutral-400 font-medium">
            The most secure way to track, split, and settle debts with friends, family, and colleagues.
          </p>
        </div>

        {/* Dynamic Minimal Card Accent */}
        <div className="border border-neutral-800 bg-neutral-900/50 p-6 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">REAL-TIME SETTLEMENTS</p>
          <p className="text-sm text-neutral-200 font-medium">Join over 50,000 users managing their daily finances effortlessly.</p>
        </div>
      </div>

      {/* Right panel: Clean minimal white canvas */}
      <div className="w-full md:w-1/2 bg-surface flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-primary tracking-tight">Welcome Back</h2>
            <p className="text-sm text-on-surface-variant">Sign in to manage your shared expenses</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-primary uppercase tracking-wider">Email Address</label>
              <div className="relative flex items-center">
                <LuMail className="absolute left-3.5 text-on-surface-variant text-base" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 bg-white border border-outline rounded-lg pl-11 pr-4 text-primary font-normal placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-primary uppercase tracking-wider">Password</label>
              <div className="relative flex items-center">
                <LuLock className="absolute left-3.5 text-on-surface-variant text-base" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 bg-white border border-outline rounded-lg pl-11 pr-11 text-primary font-normal placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-primary hover:bg-neutral-800 text-white font-medium rounded-lg flex items-center justify-center gap-2 btn-transition disabled:opacity-50 shadow-sm text-sm cursor-pointer"
            >
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              <LuArrowRight className="text-base" />
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold">Register</Link>
          </p>
        </div>
      </div>
    </main>
  );
};


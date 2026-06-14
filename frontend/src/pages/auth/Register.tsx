import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { LuWallet, LuUser, LuMail, LuLock, LuEye, LuEyeOff, LuArrowRight } from 'react-icons/lu';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    setIsSubmitting(true);
    const result = await register(name, email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Registration successful! Welcome.');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Registration failed.');
    }
  };

  return (
    <main className="min-h-screen bg-bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-card border border-border-subtle rounded-2xl p-8 shadow-level-3">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <LuWallet className="text-4xl text-secondary" />
          <span className="text-2xl font-bold tracking-tight text-primary">SplitSmart</span>
        </div>
        <h2 className="text-xl font-semibold text-primary text-center mb-2">Create Account</h2>
        <p className="text-outline text-center text-sm mb-6">Sign up to get started</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Full Name</label>
            <div className="relative flex items-center">
              <LuUser className="absolute left-3 text-outline" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg pl-10 pr-4 text-primary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Email Address</label>
            <div className="relative flex items-center">
              <LuMail className="absolute left-3 text-outline" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg pl-10 pr-4 text-primary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Password</label>
            <div className="relative flex items-center">
              <LuLock className="absolute left-3 text-outline" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full h-11 bg-surface-card border border-border-subtle rounded-lg pl-10 pr-10 text-primary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-outline hover:text-primary transition-colors"
              >
                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-secondary hover:bg-secondary-dark text-white font-semibold rounded-lg flex items-center justify-center gap-2 btn-transition disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Account...' : 'Register'}
            <LuArrowRight />
          </button>
        </form>
        <p className="text-center text-sm text-outline mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </main>
  );
};

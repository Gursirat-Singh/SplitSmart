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

  const handleSubmit = async (e) => {
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
      toast.success('Registration successful! Welcome to SplitSmart.');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8f9ff_0%,#e5eeff_100%)] px-4 py-6 text-primary sm:px-6 lg:flex lg:items-center lg:justify-center lg:px-10 lg:py-10">
      <section className="grid w-full max-w-[1100px] overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-level-2 lg:grid-cols-2">
        {/* Left Side: Pitch Banner */}
        <aside className="relative hidden overflow-hidden bg-[#131b2e] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-success/10 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-12 flex items-center gap-3">
              <LuWallet className="text-4xl text-secondary" />
              <h1 className="text-2xl font-semibold tracking-tight">SplitSmart</h1>
            </div>

            <div className="space-y-4">
              <h2 className="max-w-xl text-[32px] font-semibold leading-[1.25] tracking-tight">
                Clear calculations. Absolute trust.
              </h2>
              <p className="max-w-md text-[18px] leading-[1.6] text-on-primary-container">
                Simplify debt settlement. Track every dollar, share with flexible methods, and export reports in seconds.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-10">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-[13px] font-medium tracking-[0.02em] text-on-primary-container uppercase">
                  Accurate Membership Dates
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-on-primary-container">
                Join or leave groups at any point. Balances are calculated based on your active membership duration.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Side: Form */}
        <section className="flex flex-col justify-center bg-white px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
          <div className="mx-auto w-full max-w-md">
            <header className="mb-12">
              <h3 className="text-2xl font-semibold leading-[1.3] tracking-tight text-primary">
                Create your account
              </h3>
              <p className="mt-2 text-base leading-[1.6] text-on-surface-variant">
                Join us to manage shared balances with precision.
              </p>
            </header>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant" htmlFor="name">
                  FULL NAME
                </label>
                <div className="group relative flex h-12 items-center rounded-lg border border-border-subtle bg-bg-canvas transition-all focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
                  <LuUser className="absolute left-4 text-outline group-focus-within:text-secondary text-lg" />
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="h-full w-full rounded-lg bg-transparent pl-12 pr-4 text-base text-primary outline-none placeholder:text-outline"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant" htmlFor="email">
                  EMAIL ADDRESS
                </label>
                <div className="group relative flex h-12 items-center rounded-lg border border-border-subtle bg-bg-canvas transition-all focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
                  <LuMail className="absolute left-4 text-outline group-focus-within:text-secondary text-lg" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="h-full w-full rounded-lg bg-transparent pl-12 pr-4 text-base text-primary outline-none placeholder:text-outline"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant" htmlFor="password">
                  PASSWORD
                </label>
                <div className="group relative flex h-12 items-center rounded-lg border border-border-subtle bg-bg-canvas transition-all focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
                  <LuLock className="absolute left-4 text-outline group-focus-within:text-secondary text-lg" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="h-full w-full rounded-lg bg-transparent pl-12 pr-12 text-base text-primary outline-none placeholder:text-outline"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-outline hover:text-primary focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <LuEyeOff size={20} /> : <LuEye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-transition group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Sign Up</span>
                    <LuArrowRight className="text-xl transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <footer className="mt-12 text-center">
              <p className="text-base leading-[1.6] text-on-surface-variant">
                Already have an account?{' '}
                <Link
                  className="font-bold text-secondary transition-colors hover:underline"
                  to="/login"
                >
                  Sign in
                </Link>
              </p>
            </footer>
          </div>
        </section>
      </section>
    </main>
  );
};

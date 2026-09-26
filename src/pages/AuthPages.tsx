import React, { useState, useEffect } from 'react';
import { Route } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Building, 
  ShieldCheck, 
  ArrowRight, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface AuthPagesProps {
  view: 'login' | 'register' | 'forgot-password' | 'reset-password';
  setCurrentRoute: (route: Route) => void;
  onLoginSuccess?: () => void;
}

export default function AuthPages({ view, setCurrentRoute, onLoginSuccess }: AuthPagesProps) {
  const { signIn, signUp, signInWithGoogle, enterSandboxMode, resetPassword, updatePassword, isSupabaseConfigured } = useAuth();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clean error and success states on view transition
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [view]);

  // Input Validation Rules
  const validateForm = (): boolean => {
    if (view === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return false;
      }
      if (name.trim().length < 2) {
        setError('Name must be at least 2 characters long.');
        return false;
      }
      if (!businessName.trim()) {
        setError('Please enter your business or company name.');
        return false;
      }
    }

    if (view !== 'reset-password') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please provide a valid email address.');
        return false;
      }
    }

    if (view === 'login' || view === 'register') {
      if (!password) {
        setError('Please enter your password.');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }
    }

    if (view === 'reset-password') {
      if (!password) {
        setError('Please enter a new password.');
        return false;
      }
      if (password.length < 6) {
        setError('New password must be at least 6 characters long.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (view === 'login') {
        const result = await signIn(email.trim(), password);
        if (result.success) {
          if (onLoginSuccess) onLoginSuccess();
          setCurrentRoute('dashboard');
        } else {
          setError(result.error || 'Failed to authenticate. Please check your credentials.');
          showToast('error', result.error || 'Authentication failure.', 'Login Error');
        }
      } else if (view === 'register') {
        const result = await signUp(email.trim(), password, name.trim(), businessName.trim());
        if (result.success) {
          if (onLoginSuccess) onLoginSuccess();
          setCurrentRoute('dashboard');
        } else {
          setError(result.error || 'Failed to register account.');
          showToast('error', result.error || 'Account creation failure.', 'Registration Error');
        }
      } else if (view === 'forgot-password') {
        const result = await resetPassword(email.trim());
        if (result.success) {
          setSuccess('Reset link dispatched! Please check your email inbox.');
          showToast('success', 'Password reset instructions have been sent.', 'Email Sent');
        } else {
          setError(result.error || 'Could not trigger password reset.');
          showToast('error', result.error || 'Reset failed.', 'Request Error');
        }
      } else if (view === 'reset-password') {
        const result = await updatePassword(password);
        if (result.success) {
          setSuccess('Password updated successfully! You can now sign in.');
          showToast('success', 'Your password has been successfully updated.', 'Password Reset');
          setTimeout(() => {
            setCurrentRoute('login');
          }, 2000);
        } else {
          setError(result.error || 'Failed to reset password.');
          showToast('error', result.error || 'Reset failed.', 'Error');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected operational failure occurred.');
      showToast('error', err.message || 'Operational error.', 'Exception');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans select-none">
      {/* Visual background ambient grids */}
      <div className="absolute inset-0 bg-radial-gradient from-blue-50/50 to-transparent opacity-50 pointer-events-none" />

      {/* Back button to landing (except during recovery reset) */}
      {view !== 'reset-password' && (
        <div className="absolute top-6 left-6">
          <button
            onClick={() => setCurrentRoute('landing')}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Homepage
          </button>
        </div>
      )}

      {/* Dev Warning Banner if Supabase URL and Key are missing */}
      {!isSupabaseConfigured && (
        <div className="max-w-md mx-auto w-full px-4 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 shadow-sm text-left flex gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-normal">
              <span className="font-bold">Sandbox Mode Active</span>: Supabase is not configured yet. 
              We've enabled a <span className="font-semibold">mock persistent sandbox</span> so you can test register, login, and forgot password screens immediately!
              <div className="mt-1.5 text-[10px] text-amber-700 font-mono">
                Add <span className="font-bold">VITE_SUPABASE_URL</span> & <span className="font-bold">VITE_SUPABASE_ANON_KEY</span> to Secrets.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200/50">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-display font-black text-gray-900 tracking-tight">
          {view === 'login' && 'Sign in to BizPilot AI'}
          {view === 'register' && 'Create your BizPilot account'}
          {view === 'forgot-password' && 'Reset your password'}
          {view === 'reset-password' && 'Enter your new password'}
        </h2>
        <p className="mt-2 text-center text-xs text-gray-500 max-w">
          {view === 'login' && (
            <>
              New to our platform?{' '}
              <button onClick={() => setCurrentRoute('register')} className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                Create an account
              </button>
            </>
          )}
          {view === 'register' && (
            <>
              Already have an account?{' '}
              <button onClick={() => setCurrentRoute('login')} className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                Sign in
              </button>
            </>
          )}
          {view === 'forgot-password' && (
            <>
              Remember your password?{' '}
              <button onClick={() => setCurrentRoute('login')} className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                Sign in
              </button>
            </>
          )}
          {view === 'reset-password' && (
            <>
              Want to try logging in instead?{' '}
              <button onClick={() => setCurrentRoute('login')} className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-200/50 rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-semibold flex gap-2 items-start animate-pulse-slow">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <div className="w-full text-left">
                  {error.includes('auth/operation-not-allowed') || error.includes('operation-not-allowed') ? (
                    <div className="space-y-2">
                      <p className="font-bold">Email/Password Sign-In is disabled in this Firebase project.</p>
                      <p className="text-[11px] font-normal text-red-500 leading-relaxed">
                        To enable it, please follow these steps:
                      </p>
                      <ol className="list-decimal pl-4 text-[10px] font-normal text-red-500 space-y-1.5 leading-normal">
                        <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-red-800">Firebase Console</a>.</li>
                        <li>Select your project <strong>gen-lang-client-0526890470</strong>.</li>
                        <li>Click on <strong>Authentication</strong> in the left sidebar, then select the <strong>Sign-in method</strong> tab.</li>
                        <li>Click <strong>Add new provider</strong>, select <strong>Email/Password</strong>, enable it, and click <strong>Save</strong>.</li>
                      </ol>
                      <p className="text-[11px] font-bold text-blue-700 pt-1 leading-normal">
                        💡 Alternative: Click the Google Sign-In button below to log in instantly!
                      </p>
                      <div className="pt-2 border-t border-red-200 mt-2 flex flex-col gap-1.5">
                        <p className="text-[11px] font-bold text-emerald-800">
                          ✨ Instant Bypass (No Setup Required):
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            enterSandboxMode(email, name);
                            if (onLoginSuccess) onLoginSuccess();
                            setCurrentRoute('dashboard');
                          }}
                          className="w-full text-center py-1.5 px-2 bg-emerald-600 text-white rounded-md text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                        >
                          Launch App in Offline Sandbox Mode
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span>{error}</span>
                  )}
                </div>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold flex gap-2 items-start">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {view === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Business Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Acme Corporation"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-900"
                    />
                  </div>
                </div>
              </>
            )}

            {view !== 'reset-password' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-900"
                  />
                </div>
              </div>
            )}

            {view !== 'forgot-password' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {view === 'reset-password' ? 'New Password' : 'Password'}
                  </label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => setCurrentRoute('forgot-password')}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {view === 'reset-password' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-900"
                  />
                </div>
              </div>
            )}

            {view === 'register' && (
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  required
                  id="terms"
                  className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                />
                <label htmlFor="terms" className="text-[11px] text-gray-500 leading-normal">
                  I agree to the{' '}
                  <span className="font-semibold text-gray-700 hover:underline cursor-pointer">Terms of Service</span> and{' '}
                  <span className="font-semibold text-gray-700 hover:underline cursor-pointer">Privacy Policy</span>.
                </label>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    {view === 'login' && 'Sign In'}
                    {view === 'register' && 'Create Account'}
                    {view === 'forgot-password' && 'Send Reset Link'}
                    {view === 'reset-password' && 'Reset Password'}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Social connection divider / Google Sign-In / Sandbox disclaimer */}
          <div className="mt-6">
            {(view === 'login' || view === 'register') ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={async () => {
                      setError('');
                      setLoading(true);
                      try {
                        const res = await signInWithGoogle();
                        if (res.success) {
                          if (onLoginSuccess) onLoginSuccess();
                          setCurrentRoute('dashboard');
                        } else {
                          setError(res.error || 'Google Authentication failed.');
                        }
                      } catch (err: any) {
                        setError(err.message || 'Failed to authenticate via Google.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-gray-200 rounded-lg shadow-xs bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
                      Identity Verification
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/20 text-center flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                  <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                    All logins, password resets, and sessions are encrypted and managed securely via SSL.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

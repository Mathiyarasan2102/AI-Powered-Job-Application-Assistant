import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from '../components/Toast';
import { Bot, ArrowRight, Lock, Mail } from 'lucide-react';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[90vh] relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo Mark */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-textMuted">AI Job Assistant</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="glass-panel p-8 md:p-10 border border-white/[0.06]"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-display font-extrabold text-white mb-2">System Login</h1>
            <p className="text-textMuted text-sm">Authenticate to access your career pipeline.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-textMuted mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none" />
                <input
                  type="email"
                  {...register('email', { required: true })}
                  className="input-field pl-11"
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">Email is required</p>}
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-textMuted mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none" />
                <input
                  type="password"
                  {...register('password', { required: true })}
                  className="input-field pl-11"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">Password is required</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin"></span>
                  Authenticating...
                </span>
              ) : (
                <>Authenticate <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-sm text-textMuted">
              No account?{' '}
              <Link to="/register" className="text-primary hover:text-white font-medium transition-colors">
                Initialize one →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

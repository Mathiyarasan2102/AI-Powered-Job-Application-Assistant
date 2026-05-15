import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Menu, X, User, Clock, Plus, LogOut, LayoutDashboard, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile nav on route change
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const NavLink = ({ to, icon: Icon, children }) => (
    <Link
      to={to}
      className={`relative flex items-center gap-1.5 px-1 py-1 text-sm font-medium transition-colors duration-200 group ${
        isActive(to) ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {Icon && <Icon className={`w-3.5 h-3.5 transition-colors ${isActive(to) ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`} />}
      {children}
      {/* Active underline */}
      <span className={`absolute -bottom-0.5 left-0 right-0 h-px rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ${isActive(to) ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
    </Link>
  );

  return (
    <>
      <motion.nav
        className="fixed top-4 left-0 right-0 z-50 px-4"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 60 }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

            {/* Logo */}
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-bold text-[15px] tracking-wide text-white">
                Resu<span className="text-primary">Forge</span>
              </span>
            </Link>

            {/* Center Nav — authenticated only */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-5 absolute left-1/2 -translate-x-1/2">
                <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                <NavLink to="/job/new" icon={Plus}>New resume</NavLink>
                <NavLink to="/history" icon={Clock}>History</NavLink>
              </div>
            )}

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/15 transition-all duration-200 cursor-pointer group"
                  >
                    {/* Avatar initial */}
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-white leading-none">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors max-w-[100px] truncate">
                      {user?.name?.split(' ')[0] || 'Profile'}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full bg-primary transition-all ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-52 bg-[#0e0e0e]/98 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl"
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-white/[0.06]">
                          <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                          <p className="text-textMuted text-xs truncate mt-0.5">{user?.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-textMuted" />
                          Profile & settings
                        </Link>
                        <button
                          onClick={() => { logout(); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.04] border-t border-white/[0.06] transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Log out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-3 py-2"
                  >
                    Sign in
                  </Link>
                  <Link to="/register">
                    <button className="flex items-center gap-2 text-sm font-semibold text-black bg-primary hover:bg-primary/90 px-4 py-2 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(212,255,0,0.25)] hover:shadow-[0_0_30px_rgba(212,255,0,0.35)]">
                      Get started
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/10 transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="overlay-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              key="overlay-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 40 }}
              className="fixed top-20 left-4 right-4 z-50 md:hidden bg-[#0e0e0e]/98 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 space-y-1">
                {isAuthenticated ? (
                  <>
                    {/* User header */}
                    <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-white/[0.06]">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{user?.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{user?.name}</p>
                        <p className="text-textMuted text-xs">{user?.email}</p>
                      </div>
                    </div>

                    {[
                      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                      { to: '/job/new', icon: Plus, label: 'New resume' },
                      { to: '/history', icon: Clock, label: 'History' },
                      { to: '/profile', icon: User, label: 'Profile & settings' },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link
                        key={to}
                        to={to}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive(to) ? 'bg-white/[0.08] text-white' : 'text-gray-300 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive(to) ? 'text-primary' : 'text-gray-500'}`} />
                        {label}
                      </Link>
                    ))}

                    <div className="pt-2 border-t border-white/[0.06] mt-2">
                      <button
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-white/[0.04] hover:text-red-300 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Log out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/[0.04] hover:text-white transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link to="/register" className="block">
                      <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-black bg-primary hover:bg-primary/90 px-4 py-3 rounded-xl transition-all mt-1">
                        Get started free
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Menu, X, User, Clock, Plus, LogOut } from 'lucide-react';
import { PrimaryButton, GhostButton } from './Buttons';
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

  return (
    <motion.nav className='fixed top-5 left-0 right-0 z-50 px-4'
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
    >
        <div className='max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-md border border-white/5 rounded-2xl p-3'>
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex flex-row items-center ml-2">
                <span className="font-display font-bold text-xl tracking-wide text-white">
                    AI<span className="text-primary">Job</span>Assistant
                </span>
            </Link>

            <div className='hidden md:flex items-center gap-6 text-sm font-medium text-gray-300'>
                {isAuthenticated ? (
                  <>
                    <Link to="/job/new" className={`transition flex items-center gap-2 py-2 px-3 rounded-full ${isActive('/job/new') ? 'bg-white/5 border border-white/5 text-white' : 'border border-transparent hover:text-white hover:bg-white/5'}`}>
                        <Plus className="w-4 h-4 text-primary"/> New resume
                    </Link>
                    <Link to="/history" className={`transition flex items-center gap-2 py-2 px-3 rounded-full ${isActive('/history') ? 'bg-white/5 border border-white/5 text-white' : 'border border-transparent hover:text-white hover:bg-white/5'}`}>
                        <Clock className="w-4 h-4 text-primary"/> History
                    </Link>
                  </>
                ) : null}
            </div>

            <div className='hidden md:flex items-center gap-3'>
                {isAuthenticated ? (
                    <div className="relative" ref={profileRef}>
                        <button
                          onClick={() => setProfileOpen(p => !p)}
                          className={`transition flex items-center gap-2 py-2 px-3 rounded-full cursor-pointer ${isActive('/profile') ? 'bg-white/5 border border-white/5 text-white' : 'border border-transparent hover:text-white hover:bg-white/5'}`}
                        >
                            <User className="w-4 h-4 text-primary"/> {user?.name || 'Profile'}
                        </button>
                        <AnimatePresence>
                          {profileOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -6, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.97 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                            >
                                <Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                    Profile & settings
                                </Link>
                                <button onClick={() => { logout(); setProfileOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 border-t border-white/5 flex items-center gap-2 transition-colors">
                                    <LogOut className="w-4 h-4" /> Log out
                                </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <>
                        <Link to="/login" className='text-sm font-medium text-gray-300 hover:text-white transition max-sm:hidden mr-2'>
                            Sign in
                        </Link>
                        <Link to="/register">
                            <PrimaryButton className='max-sm:text-xs hidden sm:inline-flex'>Get Started</PrimaryButton>
                        </Link>
                    </>
                )}
            </div>

            <button onClick={() => setIsOpen(!isOpen)} className='md:hidden mr-2 text-white'>
                <Menu className='w-6 h-6' />
            </button>
        </div>
        
        {/* Mobile Nav */}
        <div className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 bg-black/80 backdrop-blur-md z-50 transition-all duration-300 overflow-hidden ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"} pointer-events-auto`}>
            {isAuthenticated ? (
                <>
                    <Link to="/job/new" onClick={() => setIsOpen(false)} className="text-white hover:text-indigo-400">New resume</Link>
                    <Link to="/history" onClick={() => setIsOpen(false)} className="text-white hover:text-indigo-400">History</Link>
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="text-white hover:text-indigo-400">Profile</Link>
                    <button onClick={() => { logout(); setIsOpen(false); }} className='font-medium text-gray-300 hover:text-white transition mt-4'>
                        Log out
                    </button>
                </>
            ) : (
                <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className='font-medium text-gray-300 hover:text-white transition mt-4'>
                        Sign in
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                        <PrimaryButton>Get Started</PrimaryButton>
                    </Link>
                </>
            )}

            <button
                onClick={() => setIsOpen(false)}
                className="absolute top-8 right-8 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
            >
                <X className="w-6 h-6"/>
            </button>
        </div>
    </motion.nav>
  );
}

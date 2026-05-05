import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SoftBackdrop from './components/SoftBackdrop';
import LenisScroll from './components/lenis';
import ToastContainer from './components/Toast';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UploadJob from './pages/UploadJob';
import ApplicationPreview from './pages/ApplicationPreview';
import History from './pages/History';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Scroll to top when the route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-x-hidden text-gray-300">
      <SoftBackdrop />
      <LenisScroll />
      <ToastContainer />
      
      <div className="z-10 flex flex-col min-h-screen">
        {!isAuthPage && <Navbar />}
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/job/new" element={<ProtectedRoute><UploadJob /></ProtectedRoute>} />
            <Route path="/job/preview" element={<ProtectedRoute><ApplicationPreview /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          </Routes>
        </main>
        {!isAuthPage && <Footer />}
      </div>
    </div>
  );
};

function App() {
  const loadUser = useAuthStore(state => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;

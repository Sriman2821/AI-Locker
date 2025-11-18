import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Components/Layout';
import AILocker from './Pages/AILocker';
import LoginPage from './Pages/LoginPage';
import SignupPage from './Pages/SignupPage';
import ForgotPasswordPage from './Pages/ForgotPasswordPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Component } from 'react';
import { TooltipProvider } from './Components/ui/tooltip';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  console.log('AppRoutes: User state:', { user, loading });

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupPage />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPasswordPage />} />
      {/* Explicit root route - authenticated users land on AILocker (learning tab by default) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <AILocker />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <AILocker />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <ErrorBoundary fallback={<div>Something went wrong. Please refresh the page.</div>}>
            <AppRoutes />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
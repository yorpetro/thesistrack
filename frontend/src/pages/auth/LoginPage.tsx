import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import ThemeToggle from '../../components/common/ThemeToggle';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = location.state?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled in the auth store
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-neutral-light dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Theme toggle in top right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-custom shadow-custom-lg p-8 border dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Thesis<span className="text-accent">Track</span>
          </h1>
          <h2 className="mt-4 text-2xl font-bold text-secondary dark:text-gray-200">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-earth dark:text-gray-400">
            Enter your credentials to access your account
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-secondary dark:text-gray-200 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-neutral dark:border-gray-600 rounded-custom placeholder-earth-light dark:placeholder-gray-400 text-secondary dark:text-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary dark:text-gray-200 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-neutral dark:border-gray-600 rounded-custom placeholder-earth-light dark:placeholder-gray-400 text-secondary dark:text-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-custom bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-custom text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 shadow-custom disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <div className="animate-spin h-5 w-5 border-2 border-b-0 border-white rounded-full" />
                  </span>
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-earth dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-600 transition duration-200">
              Create one now
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-earth-light dark:text-gray-500">
          © {new Date().getFullYear()} ThesisTrack. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 
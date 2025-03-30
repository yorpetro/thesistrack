import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-neutral-light px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-custom shadow-custom-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Thesis<span className="text-accent">Track</span>
          </h1>
          <h2 className="mt-4 text-2xl font-bold text-secondary">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-earth">
            Enter your credentials to access your account
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-secondary mb-1">
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
                className="appearance-none block w-full px-3 py-2 border border-neutral rounded-custom placeholder-earth-light text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary mb-1">
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
                className="appearance-none block w-full px-3 py-2 border border-neutral rounded-custom placeholder-earth-light text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-custom bg-red-50 border border-red-200 p-3">
              <div className="text-sm text-red-600">
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
          <p className="text-sm text-earth">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-600 transition duration-200">
              Create one now
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-earth-light">
          © {new Date().getFullYear()} ThesisTrack. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 
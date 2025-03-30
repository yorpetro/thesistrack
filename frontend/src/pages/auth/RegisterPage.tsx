import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'professor' | 'graduation_assistant'>('student');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset form error
    setFormError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      await register(email, password, fullName, role);
      navigate('/');
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
            Create Account
          </h2>
          <p className="mt-2 text-sm text-earth">
            Join ThesisTrack to manage your academic projects
          </p>
        </div>
        
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-secondary mb-1">
                Full name
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>
            
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
                className="form-input"
                placeholder="Enter your email address"
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Create a password (min. 8 characters)"
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-secondary mb-1">
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Confirm your password"
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-secondary mb-1">
                Your role
              </label>
              <select
                id="role"
                name="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'professor' | 'graduation_assistant')}
                className="form-input"
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
                <option value="graduation_assistant">Graduation Assistant</option>
              </select>
            </div>
          </div>

          {(formError || error) && (
            <div className="rounded-custom bg-red-50 border border-red-200 p-3">
              <div className="text-sm text-red-600">
                {formError || error}
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 shadow-custom disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="inline-block mr-2">
                    <div className="animate-spin h-5 w-5 border-2 border-b-0 border-white rounded-full" />
                  </span>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-earth">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-600 transition duration-200">
              Sign in here
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

export default RegisterPage; 
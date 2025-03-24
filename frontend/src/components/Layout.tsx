import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">Thesis Tracker</Link>
          <nav className="space-x-4">
            {isAuthenticated ? (
              <>
                <span className="font-medium">
                  Welcome, {user?.full_name || 'User'}
                </span>
                {user?.role === 'student' && (
                  <Link to="/dashboard/student" className="hover:underline">Dashboard</Link>
                )}
                {user?.role === 'professor' && (
                  <Link to="/dashboard/professor" className="hover:underline">Dashboard</Link>
                )}
                {user?.role === 'graduation_assistant' && (
                  <Link to="/dashboard/assistant" className="hover:underline">Dashboard</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">Login</Link>
                <Link to="/register" className="hover:underline">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      
      <footer className="bg-gray-800 text-white p-4">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} Thesis Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 
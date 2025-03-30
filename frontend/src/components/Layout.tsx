import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTheses } from '../services/thesisService';
import { Thesis } from '../types';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentThesis, setStudentThesis] = useState<Thesis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentThesis = async () => {
      if (user?.role === 'student') {
        try {
          setLoading(true);
          const theses = await getTheses();
          console.log('Student theses:', theses); // For debugging
          if (theses && theses.length > 0) {
            setStudentThesis(theses[0]);
          } else {
            setStudentThesis(null);
          }
        } catch (err) {
          console.error('Failed to fetch student thesis:', err);
          setStudentThesis(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchStudentThesis();
    }
  }, [user?.role, isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // For debugging
  useEffect(() => {
    if (user?.role === 'student') {
      console.log('Student thesis state:', studentThesis);
    }
  }, [studentThesis, user?.role]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">ThesisTrack</Link>
          <nav className="space-x-4">
            {isAuthenticated ? (
              <>
                <span className="font-medium">
                  Welcome, {user?.full_name || 'User'}
                </span>
                {user?.role === 'student' && (
                  <>
                    {loading ? (
                      <span className="text-white opacity-75">Loading...</span>
                    ) : (
                      <Link 
                        to={studentThesis ? `/theses/${studentThesis.id}` : "/theses/new"} 
                        className="hover:underline"
                      >
                        {studentThesis ? 'My Thesis' : 'Create Thesis'}
                      </Link>
                    )}
                  </>
                )}
                {(user?.role === 'professor' || user?.role === 'graduation_assistant') && (
                  <>
                    <Link to="/dashboard" className="hover:underline">Dashboard</Link>
                    <Link to="/theses" className="hover:underline">Theses</Link>
                  </>
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
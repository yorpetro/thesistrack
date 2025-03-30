import { ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import { useState, useEffect } from 'react';
import { getTheses } from '../../services/thesisService';
import { Thesis } from '../../types';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [studentThesis, setStudentThesis] = useState<Thesis | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle scrolling effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch student thesis and check if graduation assistant is selected
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

    fetchStudentThesis();
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Create appropriate navigation links based on user role
  const getNavLinks = () => {
    const links = [
      { name: 'Home', href: '/', icon: HomeIcon }
    ];

    if (user?.role === 'student') {
      if (loading) {
        links.push({ name: 'Loading...', href: '#', icon: DocumentTextIcon });
      } else if (studentThesis) {
        links.push({ 
          name: 'My Thesis', 
          href: `/theses/${studentThesis.id}`, 
          icon: DocumentTextIcon 
        });
      } else {
        links.push({ 
          name: 'Create Thesis', 
          href: '/theses/new', 
          icon: DocumentTextIcon 
        });
      }
    } else {
      links.push({ name: 'Theses', href: '/theses', icon: DocumentTextIcon });
    }

    return links;
  };

  const navLinks = getNavLinks();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Navigation */}
      <nav className={`fixed w-full z-10 transition-all duration-200 ${
        scrolled ? 'bg-white shadow-custom' : 'bg-transparent'
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="flex flex-shrink-0 items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Thesis<span className="text-accent">Track</span>
                  </span>
                </Link>
              </div>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-custom transition-all duration-200 ${
                      isActive(link.href)
                        ? 'bg-primary text-white shadow-custom'
                        : 'text-secondary hover:bg-neutral hover:text-secondary'
                    }`}
                  >
                    <link.icon className="mr-1.5 h-5 w-5" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-secondary hover:text-accent hover:bg-neutral focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {/* User profile section */}
            <div className="hidden md:flex md:items-center">
              <div className="relative ml-3 flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-1 rounded-custom bg-neutral">
                  <div className="rounded-full bg-secondary p-1 text-white">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-secondary">
                    {user?.full_name || user?.email || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-custom bg-white p-2 text-secondary hover:text-accent hover:bg-neutral transition-colors duration-200 focus:outline-none shadow-custom"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} bg-white shadow-custom`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                  isActive(link.href)
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-neutral'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="mr-2 h-5 w-5" />
                {link.name}
              </Link>
            ))}
            <div className="border-t border-neutral mt-2 pt-2">
              <div className="px-3 py-2 text-sm text-secondary">
                Signed in as: <span className="font-medium">{user?.full_name || user?.email || 'User'}</span>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-base font-medium rounded-md text-secondary hover:bg-neutral"
              >
                <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout; 
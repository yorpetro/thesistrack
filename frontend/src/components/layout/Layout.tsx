import { ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import { useState, useEffect } from 'react';
import { getTheses } from '../../services/thesisService';
import { Thesis } from '../../types';
import ProfilePicture from '../common/ProfilePicture';
import ThemeToggle from '../common/ThemeToggle';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [studentThesis, setStudentThesis] = useState<Thesis | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Handle scrolling effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (userMenuOpen && !target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

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
    } else if (user?.role === 'professor') {
      links.push({ name: 'Review', href: '/theses', icon: DocumentTextIcon });
      links.push({ name: 'Control Panel', href: '/theses/all', icon: DocumentTextIcon });
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
    // For exact matching of thesis routes to avoid conflicts
    if (path === '/theses' && location.pathname.startsWith('/theses/')) {
      return location.pathname === '/theses';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-neutral-light dark:bg-gray-900 transition-colors duration-200">
      {/* Navigation */}
      <nav className={`fixed w-full z-10 transition-all duration-200 ${
        scrolled ? 'bg-white dark:bg-gray-800 shadow-custom' : 'bg-transparent'
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
                        : 'text-secondary dark:text-gray-300 hover:bg-neutral dark:hover:bg-gray-700 hover:text-secondary dark:hover:text-gray-200'
                    }`}
                  >
                    <link.icon className="mr-1.5 h-5 w-5" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-secondary dark:text-gray-300 hover:text-accent dark:hover:text-gray-200 hover:bg-neutral dark:hover:bg-gray-700 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {/* User profile section */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              <ThemeToggle />
              <div className="relative ml-3 user-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-custom bg-neutral dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none"
                >
                  <ProfilePicture 
                    profilePicture={user?.profile_picture}
                    alt={user?.full_name || user?.email || 'User'}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-secondary dark:text-gray-200">
                    {user?.full_name || user?.email || 'User'}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-300" />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} bg-white dark:bg-gray-800 shadow-custom`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                  isActive(link.href)
                    ? 'bg-primary text-white'
                    : 'text-secondary dark:text-gray-200 hover:bg-neutral dark:hover:bg-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="mr-2 h-5 w-5" />
                {link.name}
              </Link>
            ))}
            <div className="border-t border-neutral dark:border-gray-700 mt-2 pt-2">
              <div className="px-3 py-2 text-sm text-secondary dark:text-gray-300">
                Signed in as: <span className="font-medium">{user?.full_name || user?.email || 'User'}</span>
              </div>
              <Link
                to="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium flex items-center text-secondary dark:text-gray-200 hover:bg-neutral dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Cog6ToothIcon className="mr-2 h-5 w-5" />
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center px-3 py-2 text-base font-medium rounded-md text-secondary dark:text-gray-200 hover:bg-neutral dark:hover:bg-gray-700"
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
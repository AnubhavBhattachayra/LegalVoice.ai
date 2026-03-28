'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FaBars, FaTimes, FaUser, FaFileAlt, FaCrown, FaRobot, FaTachometerAlt } from 'react-icons/fa';
import { useAuthContext } from '../features/auth/AuthContext';
import { motion } from 'framer-motion';

export const Navbar = () => {
  const { user, logout, loading } = useAuthContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Toggle mobile menu
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  // Toggle user dropdown menu
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);
  
  // Handle scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigation links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Assistant', path: '/chat', isNew: false },
    { name: 'Documents', path: '/documents' },
    { 
      name: 'AI Drafting', 
      path: '/documents/draft',
      isNew: false
    },
    { name: 'OCR', path: '/ocr' },
    { name: 'Lawyers', path: '/lawyers' },
    { name: 'About', path: '/about' },
  ];

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.nav 
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className={`fixed w-full z-50 transition-all duration-300 ${
        pathname === '/chat'
          ? 'bg-[#0a0c20] bg-opacity-95 backdrop-blur-md border-b border-[#343a5a] py-3 shadow-lg'
        : scrolled 
          ? 'bg-[color:var(--card)] backdrop-blur-md border-b border-[color:var(--border)] py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <span className="text-2xl font-bold text-white flex items-center">
            <FaRobot className="mr-2 text-[color:var(--accent)]" />
            LegalVoice<span className="text-[color:var(--accent)]">.AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`font-medium hover:text-[color:var(--accent)] transition-colors flex items-center ${
                pathname === link.path 
                  ? 'text-[color:var(--accent)] border-b-2 border-[color:var(--accent)]' 
                  : pathname === '/chat' ? 'text-white' : scrolled ? 'text-[color:var(--foreground)]' : 'text-[color:var(--foreground)]'
              }`}
            >
              {link.name}
              {/* Commented out NEW badge - can be restored later if needed
              {link.isNew && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-[color:var(--accent)] text-white rounded-full">
                  NEW
                </span>
              )}
              */}
            </Link>
          ))}
        </div>

        {/* Authentication Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {!loading && (
            !user ? (
              <>
                <Link 
                  href="/login" 
                  className="font-medium px-4 py-2 rounded-lg hover:bg-[color:var(--muted)] transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  href="/register" 
                  className="bg-[color:var(--primary)] text-white font-medium px-4 py-2 rounded-lg hover:bg-[color:var(--primary-hover)] transition-colors glow-effect"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center w-8 h-8 bg-[color:var(--secondary)] rounded-full text-white hover:bg-[color:var(--secondary-hover)] transition-colors"
                  title="Dashboard"
                >
                  <FaTachometerAlt />
                </Link>
                <div className="relative">
                  <button 
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-[color:var(--primary)] rounded-full flex items-center justify-center text-white">
                      <FaUser />
                    </div>
                    <span className="font-medium text-[color:var(--foreground)]">{user.email?.split('@')[0]}</span>
                  </button>
                  
                  {isUserMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-[color:var(--card)] rounded-lg shadow-lg py-2 z-10 border border-[color:var(--border)]"
                    >
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-[color:var(--foreground)] hover:bg-[color:var(--muted)] flex items-center"
                      >
                        <FaTachometerAlt className="mr-2 text-[color:var(--secondary)]" />
                        Dashboard
                      </Link>
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-[color:var(--foreground)] hover:bg-[color:var(--muted)] flex items-center"
                      >
                        <FaUser className="mr-2 text-[color:var(--primary)]" />
                        My Profile
                      </Link>
                      <Link 
                        href="/documents/my-documents" 
                        className="block px-4 py-2 text-[color:var(--foreground)] hover:bg-[color:var(--muted)] flex items-center"
                      >
                        <FaFileAlt className="mr-2 text-[color:var(--secondary)]" />
                        My Documents
                      </Link>
                      <Link 
                        href="/user/credits" 
                        className="block px-4 py-2 text-[color:var(--foreground)] hover:bg-[color:var(--muted)] flex items-center"
                      >
                        <FaCrown className="mr-2 text-[color:var(--accent)]" />
                        Credits & Subscription
                      </Link>
                      <hr className="my-1 border-[color:var(--border)]" />
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                      >
                        Log Out
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-[color:var(--foreground)] hover:text-[color:var(--primary)] focus:outline-none" 
          onClick={toggleMenu}
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden fixed inset-0 z-50 bg-[color:var(--card)] pt-16"
        >
          <div className="container mx-auto px-4 py-6 flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`py-4 text-lg font-medium border-b border-[color:var(--border)] flex items-center ${
                  pathname === link.path 
                    ? 'text-[color:var(--primary)]' 
                    : 'text-[color:var(--foreground)]'
                }`}
              >
                {link.name}
                {/* Commented out NEW badge - can be restored later if needed
                {link.isNew && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-[color:var(--accent)] text-white rounded-full">
                    NEW
                  </span>
                )}
                */}
              </Link>
            ))}
            
            {!loading && (
              !user ? (
                <div className="flex flex-col space-y-3 mt-6">
                  <Link 
                    href="/login" 
                    className="w-full text-center font-medium py-3 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition-colors"
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/register" 
                    className="w-full text-center bg-[color:var(--primary)] text-white font-medium py-3 rounded-lg hover:bg-[color:var(--primary-hover)] transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="mt-6">
                  <div className="flex items-center py-4 border-b border-[color:var(--border)]">
                    <div className="w-10 h-10 bg-[color:var(--primary)] rounded-full flex items-center justify-center text-white mr-3">
                      <FaUser />
                    </div>
                    <span className="font-medium text-[color:var(--foreground)]">{user.email?.split('@')[0]}</span>
                  </div>
                  <Link 
                    href="/dashboard" 
                    className="block py-4 text-lg font-medium border-b border-[color:var(--border)] text-[color:var(--foreground)] flex items-center"
                  >
                    <FaTachometerAlt className="mr-2 text-[color:var(--secondary)]" />
                    Dashboard
                  </Link>
                  <Link 
                    href="/profile" 
                    className="block py-4 text-lg font-medium border-b border-[color:var(--border)] text-[color:var(--foreground)] flex items-center"
                  >
                    <FaUser className="mr-2 text-[color:var(--primary)]" />
                    My Profile
                  </Link>
                  <Link 
                    href="/documents/my-documents" 
                    className="block py-4 text-lg font-medium border-b border-[color:var(--border)] text-[color:var(--foreground)] flex items-center"
                  >
                    <FaFileAlt className="mr-2 text-[color:var(--secondary)]" />
                    My Documents
                  </Link>
                  <Link 
                    href="/user/credits" 
                    className="block py-4 text-lg font-medium border-b border-[color:var(--border)] text-[color:var(--foreground)] flex items-center"
                  >
                    <FaCrown className="mr-2 text-[color:var(--accent)]" />
                    Credits & Subscription
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left py-4 text-lg font-medium text-[color:var(--foreground)]"
                  >
                    Log Out
                  </button>
                </div>
              )
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar; 
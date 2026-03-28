'use client';

import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaRocket, FaRobot } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  const [year, setYear] = useState('2024');
  
  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="bg-[color:var(--card)] text-[color:var(--foreground)] border-t border-[color:var(--border)]">
      <div className="container mx-auto py-16 px-4 relative">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-[color:var(--primary)] rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-[color:var(--accent)] rounded-full"></div>
          <div className="absolute top-40 right-40 w-16 h-16 border border-[color:var(--secondary)] rounded-lg rotate-12"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <FaRobot className="mr-2 text-[color:var(--accent)]" />
              LegalVoice<span className="text-[color:var(--secondary)]">.AI</span>
            </h3>
            <p className="text-[color:var(--foreground)]/70 mb-4">
              Simplifying legal documentation through voice commands and artificial intelligence.
              Making legal processes accessible to everyone in India.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-[color:var(--foreground)]/50 hover:text-[color:var(--accent)] transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="text-[color:var(--foreground)]/50 hover:text-[color:var(--accent)] transition-colors">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="text-[color:var(--foreground)]/50 hover:text-[color:var(--accent)] transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="text-[color:var(--foreground)]/50 hover:text-[color:var(--accent)] transition-colors">
                <FaLinkedin size={20} />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: 'Home', path: '/' },
                { name: 'All Documents', path: '/documents' },
                { name: 'OCR Services', path: '/ocr' },
                { name: 'Lawyers Directory', path: '/lawyers' },
                { name: 'About Us', path: '/about' },
                { name: 'FAQ', path: '/faq' },
              ].map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-[color:var(--foreground)]/70 hover:text-[color:var(--primary)] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-xl font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center text-[color:var(--foreground)]/70">
                <FaPhoneAlt className="mr-3 text-[color:var(--secondary)]" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center text-[color:var(--foreground)]/70">
                <FaEnvelope className="mr-3 text-[color:var(--secondary)]" />
                <span>contact@legalvoice.ai</span>
              </li>
              <li className="flex items-start text-[color:var(--foreground)]/70">
                <FaMapMarkerAlt className="mr-3 mt-1 text-[color:var(--secondary)]" />
                <span>123 Tech Park, Sector 15<br />Gurugram, Haryana 122001<br />India</span>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="text-xl font-semibold mb-4">Stay Updated</h4>
            <p className="text-[color:var(--foreground)]/70 mb-4">
              Subscribe to our newsletter to receive updates on new features and legal document templates.
            </p>
            <form className="flex flex-col space-y-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Your email address" 
                className="bg-[color:var(--muted)] border border-[color:var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] text-[color:var(--foreground)]"
                suppressHydrationWarning
              />
              <button 
                type="submit" 
                className="bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] transition-colors text-white font-medium py-2 px-4 rounded-lg glow-effect"
                suppressHydrationWarning
              >
                <span className="flex items-center justify-center">
                  Subscribe <FaRocket className="ml-2" />
                </span>
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[color:var(--border)] py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-[color:var(--foreground)]/50 text-sm mb-4 md:mb-0">
            &copy; {year} LegalVoice.AI. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="text-[color:var(--foreground)]/50 hover:text-[color:var(--accent)] text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-[color:var(--foreground)]/50 hover:text-[color:var(--accent)] text-sm transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookie-policy" className="text-[color:var(--foreground)]/50 hover:text-[color:var(--accent)] text-sm transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
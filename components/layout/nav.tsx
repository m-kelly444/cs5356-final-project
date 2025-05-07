'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface NavLink {
  name: string;
  href: string;
  active?: boolean;
}

interface NavDropdownItem extends NavLink {
  description?: string;
}

interface NavDropdown {
  name: string;
  items: NavDropdownItem[];
}

interface NavbarProps {
  transparent?: boolean;
  centerLinks?: boolean;
}

export default function Nav({ transparent = false, centerLinks = false }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Main navigation links
  const links: (NavLink | NavDropdown)[] = [
    { name: 'Dashboard', href: '/dashboard' },
    {
      name: 'Threats',
      items: [
        { 
          name: 'Overview', 
          href: '/dashboard/threats',
          description: 'Summary of current threats'
        },
        { 
          name: 'Cyber Attacks', 
          href: '/dashboard/threats/attacks',
          description: 'Recent cyber attack data'
        },
        { 
          name: 'Threat Actors', 
          href: '/dashboard/threats/actors',
          description: 'Known threat actor profiles'
        },
      ]
    },
    {
      name: 'Vulnerabilities',
      items: [
        { 
          name: 'Overview', 
          href: '/dashboard/vulnerabilities',
          description: 'Critical vulnerability dashboard'
        },
        { 
          name: 'CISA KEV', 
          href: '/dashboard/vulnerabilities/kev',
          description: 'Known Exploited Vulnerabilities'
        },
        { 
          name: 'NVD Data', 
          href: '/dashboard/vulnerabilities/nvd',
          description: 'National Vulnerability Database'
        },
      ]
    },
    { name: 'Attack Map', href: '/dashboard/attack-map' },
    { name: 'Predictions', href: '/dashboard/predictions' },
  ];
  
  // Handle scroll effect for transparent header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(typeof window !== 'undefined' ? typeof window !== 'undefined' && window.scrollY > 10);
    };
    
    if (transparent) {
      typeof window !== 'undefined' ? typeof window !== 'undefined' && window.addEventListener('scroll', handleScroll);
      return () => typeof window !== 'undefined' ? typeof window !== 'undefined' && window.removeEventListener('scroll', handleScroll);
    }
  }, [transparent]);
  
  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setActiveDropdown(null);
      }
    };
    
    typeof document !== 'undefined' ? typeof document !== 'undefined' ? document.addEventListener('click', handleClickOutside);
    return () => typeof document !== 'undefined' ? typeof document !== 'undefined' ? document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // Toggle dropdown
  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };
  
  // Check if a link is active
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };
  
  // Render dropdown
  const renderDropdown = (dropdown: NavDropdown) => {
    const isDropdownActive = dropdown.items.some(item => isActive(item.href));
    
    return (
      <div className="relative" data-dropdown>
        <button
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            isDropdownActive
              ? 'text-cyan-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
          } transition-colors`}
          onClick={() => toggleDropdown(dropdown.name)}
          aria-expanded={activeDropdown === dropdown.name}
        >
          {dropdown.name}
          <ChevronDown
            size={16}
            className={`ml-1 transition-transform ${
              activeDropdown === dropdown.name ? 'rotate-180' : ''
            }`}
          />
        </button>
        
        <AnimatePresence>
          {activeDropdown === dropdown.name && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-10 cyber-card"
            >
              <div className="py-1">
                {dropdown.items.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className={`block px-4 py-2 text-sm ${
                      isActive(item.href)
                        ? 'bg-gray-800/50 text-cyan-400'
                        : 'text-gray-300 hover:bg-gray-800/80 hover:text-cyan-400'
                    } transition-colors`}
                    onClick={() => setActiveDropdown(null)}
                  >
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  // Render regular link
  const renderLink = (link: NavLink) => (
    <Link
      href={link.href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        isActive(link.href)
          ? 'text-cyan-400'
          : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
      } transition-colors`}
    >
      {link.name}
    </Link>
  );
  
  return (
    <nav
      className={`${
        transparent
          ? scrolled
            ? 'bg-gray-900/80 backdrop-blur-sm shadow-md'
            : 'bg-transparent'
          : 'bg-gray-900'
      } transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-white">CyberPulse</span>
            </Link>
          </div>
          
          {/* Navigation links */}
          <div className={`hidden md:block ${centerLinks ? 'mx-auto' : ''}`}>
            <div className="flex items-center space-x-4">
              {links.map((link, index) => (
                <div key={index}>
                  {'items' in link ? renderDropdown(link) : renderLink(link)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side actions */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-white font-medium">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  System: Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
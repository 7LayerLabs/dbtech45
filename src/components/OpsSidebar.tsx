'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  Lightbulb,
  Youtube,
  Search,
  Sparkles,
  Moon,
  Sun,
  Radio,
} from 'lucide-react';

const voidTheme = {
  void: '#06070b',
  carbon: '#0a0a0f',
  border: 'rgba(245, 158, 11, 0.15)',
  borderHover: 'rgba(245, 158, 11, 0.3)',
  amber: '#f59e0b',
  amberDim: 'rgba(245, 158, 11, 0.7)',
  white: '#f5f5f5',
  smoke: 'rgba(255, 255, 255, 0.5)',
  dimText: 'rgba(255, 255, 255, 0.35)',
};

const cyberTheme = {
  void: '#050e07',
  carbon: '#07120a',
  border: 'rgba(16, 202, 120, 0.2)',
  borderHover: 'rgba(16, 202, 120, 0.5)',
  amber: '#10ca78',
  amberDim: 'rgba(16, 202, 120, 0.6)',
  white: '#f0f0f0',
  smoke: 'rgba(240, 240, 240, 0.55)',
  dimText: 'rgba(200, 220, 200, 0.4)',
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
}

const navItems: NavItem[] = [
  { label: 'OPS Home', href: '/ops', icon: Home },
  { label: 'Projects', href: '/os/projects', icon: Lightbulb },
  { label: 'Clipd', href: '/ops/clipd', icon: Youtube },
  { label: 'Podsnap', href: '/ops/podsnap', icon: Radio },
  { label: 'Research', href: '/ops/research', icon: Search },
  { label: 'X Clipd', href: '/ops/x-clipd', icon: Sparkles },
];

export default function OpsSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'void' | 'cyber'>('void');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dbtech-color-mode');
      if (stored === 'cyber') setColorMode('cyber');
    } catch {}
  }, []);

  const toggleColorMode = () => {
    const newMode = colorMode === 'void' ? 'cyber' : 'void';
    setColorMode(newMode);
    try {
      localStorage.setItem('dbtech-color-mode', newMode);
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const theme = colorMode === 'cyber' ? cyberTheme : voidTheme;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: theme.void,
      color: theme.white,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: collapsed ? '70px' : '240px',
        background: theme.carbon,
        borderRight: `1px solid ${theme.border}`,
        transition: 'width 0.3s',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }} className="hidden md:flex">
        {/* Header */}
        <div style={{
          padding: collapsed ? '20px 10px' : '20px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/ops" style={{
            fontSize: collapsed ? '18px' : '20px',
            fontWeight: 700,
            color: theme.amber,
            textDecoration: 'none',
            fontFamily: "'Space Grotesk', monospace",
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
          }}>
            {collapsed ? 'OPS' : 'Derek OPS'}
          </Link>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{
              background: 'none',
              border: 'none',
              color: theme.smoke,
              cursor: 'pointer',
              padding: '4px',
            }}>
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '12px',
                padding: collapsed ? '12px 10px' : '12px 20px',
                margin: collapsed ? '4px 10px' : '4px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? theme.amber : theme.smoke,
                background: isActive ? `${theme.amber}10` : 'transparent',
                border: `1px solid ${isActive ? theme.borderHover : 'transparent'}`,
                transition: 'all 0.2s',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = `${theme.amber}05`;
                  e.currentTarget.style.borderColor = theme.border;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}>
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: collapsed ? '20px 10px' : '20px',
          borderTop: `1px solid ${theme.border}`,
        }}>
          <button onClick={toggleColorMode} style={{
            width: '100%',
            padding: collapsed ? '10px' : '10px 16px',
            background: `${theme.amber}10`,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            color: theme.amber,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? '0' : '8px',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${theme.amber}20`;
            e.currentTarget.style.borderColor = theme.borderHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${theme.amber}10`;
            e.currentTarget.style.borderColor = theme.border;
          }}>
            {colorMode === 'void' ? <Moon size={18} /> : <Sun size={18} />}
            {!collapsed && <span>{colorMode === 'void' ? 'Void' : 'Cyber'}</span>}
          </button>
          {collapsed && (
            <button onClick={() => setCollapsed(false)} style={{
              width: '100%',
              marginTop: '10px',
              padding: '10px',
              background: 'none',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              color: theme.smoke,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button onClick={() => setMobileOpen(true)} style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 50,
        background: theme.carbon,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '10px',
        color: theme.amber,
        cursor: 'pointer',
      }} className="md:hidden">
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
          }} className="md:hidden" />
          <aside style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: '240px',
            background: theme.carbon,
            borderRight: `1px solid ${theme.border}`,
            zIndex: 51,
            display: 'flex',
            flexDirection: 'column',
          }} className="md:hidden">
            <div style={{
              padding: '20px',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Link href="/ops" style={{
                fontSize: '20px',
                fontWeight: 700,
                color: theme.amber,
                textDecoration: 'none',
                fontFamily: "'Space Grotesk', monospace",
              }}>
                Derek OPS
              </Link>
              <button onClick={() => setMobileOpen(false)} style={{
                background: 'none',
                border: 'none',
                color: theme.smoke,
                cursor: 'pointer',
              }}>
                <X size={24} />
              </button>
            </div>
            <nav style={{ flex: 1, padding: '20px 0' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    margin: '4px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: isActive ? theme.amber : theme.smoke,
                    background: isActive ? `${theme.amber}10` : 'transparent',
                    border: `1px solid ${isActive ? theme.borderHover : 'transparent'}`,
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main style={{
        marginLeft: collapsed ? '70px' : '240px',
        flex: 1,
        transition: 'margin-left 0.3s',
        minHeight: '100vh',
      }} className="md:ml-[240px] ml-0">
        {children}
      </main>
    </div>
  );
}

import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import type { Screen } from '@/types';

const tabs: { screen: Screen; label: string; icon: React.ReactNode }[] = [
  {
    screen: 'home',
    label: 'الرئيسية',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    screen: 'borrowers',
    label: 'العملاء',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    screen: 'loans',
    label: 'العقود',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 8h-6a2 2 0 000 4h4a2 2 0 010 4H8" />
        <line x1="12" y1="18" x2="12" y2="18.01" />
      </svg>
    ),
  },
  {
    screen: 'reports',
    label: 'التقارير',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="3" y1="20" x2="21" y2="20" />
      </svg>
    ),
  },
  {
    screen: 'calculator',
    label: 'الحاسبة',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="8" y2="10.01" />
        <line x1="12" y1="10" x2="12" y2="10.01" />
        <line x1="16" y1="10" x2="16" y2="10.01" />
        <line x1="8" y1="14" x2="8" y2="14.01" />
        <line x1="12" y1="14" x2="12" y2="14.01" />
        <line x1="16" y1="14" x2="16" y2="14.01" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { currentScreen, navigateToScreen, unreadCount } = useApp();

  // Only show on 5 main screens
  if (!(['home', 'borrowers', 'loans', 'reports', 'calculator'] as Screen[]).includes(currentScreen)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ height: '70px', background: '#111D32', borderTop: '2px solid #D4AF37' }}>
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-1 relative">
        {tabs.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button key={item.screen} onClick={() => navigateToScreen(item.screen)} className="flex flex-col items-center justify-center gap-1 py-2 px-2 relative" style={{ minWidth: '52px' }}>
              {/* Active indicator line - above the tab */}
              {isActive && (
                <motion.div
                  className="absolute rounded-full"
                  style={{ background: '#D4AF37', width: '40px', height: '3px', top: '-10px', left: '50%', marginLeft: '-20px' }}
                  layoutId="activeTabIndicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.3 }} style={{ color: isActive ? '#D4AF37' : '#A3956B' }} className="relative">
                {item.icon}
                {item.screen === 'home' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#DC2626', color: '#fff', fontSize: '9px' }}>{unreadCount}</span>
                )}
              </motion.div>
              <span className="font-medium" style={{ color: isActive ? '#D4AF37' : '#A3956B', fontSize: '10px' }}>{item.label}</span>
              {isActive && <motion.div className="absolute inset-0 rounded-lg" style={{ background: 'rgba(212, 175, 55, 0.08)' }} layoutId="activeBg" transition={{ type: 'spring', stiffness: 400, damping: 25 }} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

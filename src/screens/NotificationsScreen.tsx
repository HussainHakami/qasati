import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { screenVariants, itemVariants } from '@/lib/animation';
const typeIcons: Record<string, { color: string; bg: string; label: string }> = {
  payment_received: { color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', label: 'دفعة' },
  overdue: { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)', label: 'متأخر' },
  upcoming: { color: '#D4AF37', bg: 'rgba(212, 175, 55, 0.12)', label: 'مستحق' },
  loan_completed: { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)', label: 'مكتمل' },
};
export default function NotificationsScreen() {
  const { notifications, markNotificationRead, navigateBack } = useApp();
  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <motion.div variants={itemVariants} className="flex items-center gap-3 px-5 pt-4 pb-2">
        <button onClick={navigateBack} className="p-2 rounded-full" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 className="font-kufi text-xl font-bold text-gold">التنبيهات</h1>
      </motion.div>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {notifications.map(n => {
          const style = typeIcons[n.type] || typeIcons.upcoming;
          return (
            <motion.div key={n.id} variants={itemVariants} onClick={() => markNotificationRead(n.id)}
              className="mb-2 p-3 rounded-xl flex items-start gap-3" style={{ background: n.read ? '#0F1A2E' : '#111D32', border: n.read ? '1px solid rgba(212, 175, 55, 0.05)' : '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: style.bg }}>
                {n.type === 'payment_received' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                {n.type === 'overdue' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
                {n.type === 'upcoming' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                {n.type === 'loan_completed' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-cream">{n.message}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#D4AF37' }} />}
                </div>
                <p className="text-xs text-cream-muted mt-0.5">{n.date}</p>
              </div>
            </motion.div>
          );
        })}
        {notifications.length === 0 && <p className="text-xs text-cream-muted text-center py-8">لا توجد تنبيهات</p>}
      </div>
    </motion.div>
  );
}

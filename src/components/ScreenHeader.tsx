import { motion } from 'framer-motion';
import { itemVariants } from '@/lib/animation';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

export default function ScreenHeader({ title, onBack, action }: ScreenHeaderProps) {
  return (
    <motion.div variants={itemVariants} className="flex items-center gap-3 px-5 pt-4 pb-2 shrink-0">
      {onBack && (
        <button onClick={onBack} className="p-2 rounded-full" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}
      <h1 className="font-kufi text-xl font-bold text-gold flex-1">{title}</h1>
      {action}
    </motion.div>
  );
}

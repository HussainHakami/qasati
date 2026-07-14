import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  icon?: 'warning' | 'delete' | 'logout';
  onConfirm: () => void;
  onCancel: () => void;
}

const iconMap = {
  warning: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  delete: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
  logout: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
};

export default function ConfirmModal({ show, title, message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء', confirmColor = '#DC2626', icon = 'warning', onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(10, 22, 40, 0.85)' }}
          onClick={onCancel}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#111D32', border: `2px solid ${confirmColor}` }}
            onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: `${confirmColor}15` }}>
              {iconMap[icon]}
            </div>
            <h3 className="text-lg font-bold text-cream text-center mb-1">{title}</h3>
            <p className="text-sm text-cream-muted text-center mb-5">{message}</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 rounded-full font-bold text-sm" style={{ background: '#1A2D4A', color: '#A3956B' }}>{cancelLabel}</button>
              <button onClick={onConfirm} className="flex-1 py-3 rounded-full font-bold text-sm" style={{ background: confirmColor, color: '#fff' }}>{confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

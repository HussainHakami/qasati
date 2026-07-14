import { motion } from 'framer-motion';
import { itemVariants } from '@/lib/animation';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  dir?: string;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
}

export default function FormField({ label, value, onChange, error, dir, type, placeholder, textarea, rows = 3 }: FormFieldProps) {
  const baseStyle: React.CSSProperties = {
    background: '#111D32',
    border: error ? '2px solid #DC2626' : '2px solid rgba(212, 175, 55, 0.3)',
    color: '#F5F0E0',
  };

  return (
    <motion.div variants={itemVariants} className="mt-3">
      <label className="text-sm text-cream-muted block mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full py-3 px-4 rounded-xl outline-none text-sm resize-none"
          style={{ ...baseStyle, minHeight: `${rows * 24}px` }} />
      ) : (
        <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full py-3 px-4 rounded-xl outline-none text-sm" style={baseStyle} dir={dir} />
      )}
      {error && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{error}</p>}
    </motion.div>
  );
}

interface InfoCardProps {
  label: string;
  value: string;
  gold?: boolean;
  accent?: boolean;
  danger?: boolean;
  className?: string;
}

export default function InfoCard({ label, value, gold, accent, danger, className = '' }: InfoCardProps) {
  const color = gold ? '#D4AF37' : accent ? '#059669' : danger ? '#DC2626' : '#F5F0E0';
  return (
    <div className={`p-2.5 rounded-xl text-center ${className}`} style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
      <p className="text-xs text-cream-muted mb-0.5">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

export function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-2 rounded-xl text-center" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
      <p className="text-lg font-bold" style={{ color: accent ? '#DC2626' : '#D4AF37' }}>{value}</p>
      <p className="text-xs text-cream-muted">{label}</p>
    </div>
  );
}

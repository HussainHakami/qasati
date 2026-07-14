// Rating badge
export function RatingBadge({ rating }: { rating: string }) {
  const color = rating === 'trusted' ? '#059669' : rating === 'average' ? '#D4AF37' : '#DC2626';
  const label = rating === 'trusted' ? 'موثوق' : rating === 'average' ? 'متوسط' : 'متأخر';
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${color}20`, color }}>
      {label}
    </span>
  );
}

// Loan status badge
export function LoanStatusBadge({ status }: { status: string }) {
  const color = status === 'active' ? '#059669' : status === 'overdue' ? '#DC2626' : '#2563EB';
  const label = status === 'active' ? 'نشط' : status === 'overdue' ? 'متأخر' : 'مغلق';
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${color}20`, color }}>
      {label}
    </span>
  );
}

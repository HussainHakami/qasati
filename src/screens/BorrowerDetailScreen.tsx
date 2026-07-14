import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';
import { sendWhatsApp } from '@/lib/whatsapp';
import { screenVariantsLeft, itemVariants } from '@/lib/animation';
import ScreenHeader from '@/components/ScreenHeader';
import { RatingBadge, LoanStatusBadge } from '@/components/StatusBadge';

import InfoCard, { SummaryCard } from '@/components/InfoCard';

export default function BorrowerDetailScreen() {
  const { screenState, borrowers, loans, payments, navigateBack, navigateToScreen, navigateToLoan, fillTemplate, updateBorrower, receivePayment } = useApp();
  const [payLoanId, setPayLoanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'bank'>('cash');
  const [isPaying, setIsPaying] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRating, setEditRating] = useState<'trusted' | 'average' | 'late'>('average');

  const borrower = borrowers.find(b => b.id === screenState.borrowerId);
  if (!borrower) return <motion.div variants={screenVariantsLeft} initial="hidden" animate="visible" exit="exit" className="h-full flex items-center justify-center"><p className="text-cream-muted">العميل غير موجود</p></motion.div>;

  const borrowerLoans = loans.filter(l => l.borrowerId === borrower.id);
  const activeLoans = borrowerLoans.filter(l => l.status === 'active' || l.status === 'overdue');
  const borrowerPayments = payments.filter(p => p.borrowerId === borrower.id);
  const totalLoaned = borrowerLoans.reduce((s, l) => s + l.amount, 0);
  const totalPaid = borrowerPayments.reduce((s, p) => s + p.amount, 0);
  const totalRemaining = activeLoans.reduce((s, l) => {
    const remainingMonths = l.monthsTotal - l.monthsPaid;
    if (remainingMonths <= 0) return s;
    return s + (l.monthlyPayment * (remainingMonths - 1) + l.lastPayment);
  }, 0);

  const handleReceivePayment = (loanId: string) => {
    const loan = activeLoans.find(l => l.id === loanId);
    if (!loan) return;
    setIsPaying(true);
    // Record the actual payment via context
    receivePayment({
      loanId: loan.id,
      borrowerId: loan.borrowerId,
      borrowerName: loan.borrowerName,
      amount: loan.monthsPaid + 1 >= loan.monthsTotal ? loan.lastPayment : loan.monthlyPayment,
      method: paymentMethod,
      notes: '',
    });
    setTimeout(() => {
      setIsPaying(false);
      setPayLoanId(null);
    }, 800);
  };

  const openEdit = () => {
    setEditName(borrower.name); setEditPhone(borrower.phone); setEditIdNumber(borrower.idNumber || '');
    setEditAddress(borrower.address || ''); setEditNotes(borrower.notes || ''); setEditRating(borrower.rating); setShowEdit(true);
  };

  const handleSave = () => {
    if (!editName.trim() || !editPhone.trim()) return;
    updateBorrower(borrower.id, { name: editName.trim(), phone: editPhone.trim(), idNumber: editIdNumber.trim() || undefined, address: editAddress.trim() || undefined, notes: editNotes.trim() || undefined, rating: editRating });
    setShowEdit(false);
  };

  return (
    <motion.div variants={screenVariantsLeft} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <ScreenHeader title="ملف العميل" onBack={navigateBack} action={
        <button onClick={openEdit} className="p-2 rounded-full" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.3)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        </button>
      } />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Profile */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mt-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960E)', color: '#0A1628' }}>{borrower.name.charAt(0)}</div>
          <h2 className="text-lg font-bold text-cream mt-2">{borrower.name}</h2>
          <RatingBadge rating={borrower.rating} />
        </motion.div>

        {/* Info Grid */}
        <motion.div variants={itemVariants} className="mt-3 grid grid-cols-2 gap-2">
          <InfoCard label="الجوال" value={borrower.phone} />
          <InfoCard label="الهوية" value={borrower.idNumber ?? '—'} />
          <InfoCard label="العنوان" value={borrower.address ?? '—'} />
          <InfoCard label="تاريخ التسجيل" value={borrower.createdAt ? new Date(borrower.createdAt).toLocaleDateString('ar-SA') : '—'} />
        </motion.div>

        {/* Notes */}
        {borrower.notes && (
          <motion.div variants={itemVariants} className="mt-2 p-3 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <p className="text-xs text-cream-muted mb-1">ملاحظات</p>
            <p className="text-sm text-cream">{borrower.notes}</p>
          </motion.div>
        )}

        {/* Financial Summary */}
        <motion.div variants={itemVariants} className="mt-3 grid grid-cols-3 gap-2">
          <SummaryCard label="إجمالي العقود" value={`${fmt(totalLoaned)}`} />
          <SummaryCard label="محصل" value={`${fmt(totalPaid)}`} />
          <SummaryCard label="مستحق" value={`${fmt(totalRemaining)}`} accent />
        </motion.div>

        {/* Active Loans */}
        <motion.div variants={itemVariants} className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-cream">العقود النشطة</h3>
            <button onClick={() => navigateToScreen('addLoan')} className="text-xs font-bold text-gold px-2 py-1 rounded-lg" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>+ عقد جديد</button>
          </div>
          {activeLoans.map(loan => {
            const progress = (loan.monthsPaid / loan.monthsTotal) * 100;
            const remainingMonths = loan.monthsTotal - loan.monthsPaid;
            const remaining = remainingMonths > 0 ? loan.monthlyPayment * (remainingMonths - 1) + loan.lastPayment : 0;
            const isLastPayment = loan.monthsPaid + 1 === loan.monthsTotal;
            const nextInstallment = isLastPayment ? loan.lastPayment : loan.monthlyPayment;
            return (
              <div key={loan.id} className="mb-3 p-4 rounded-xl" style={{ background: '#111D32', border: loan.status === 'overdue' ? '1px solid #DC2626' : '1px solid rgba(212, 175, 55, 0.15)' }}>
                {/* Header: Product + Status + Total Remaining */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigateToLoan(loan.id)} className="text-right">
                      <p className="text-sm font-bold text-cream">{loan.productName}</p>
                    </button>
                    <LoanStatusBadge status={loan.status} />
                  </div>
                  <span className="text-sm font-bold text-gold">{fmt(remaining)} ر.س</span>
                </div>

                {/* Installment Info Row */}
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-cream-muted">القسط القادم</p>
                  <p className="text-xs text-cream">{fmt(nextInstallment)} ر.س {isLastPayment && <span className="text-xs" style={{ color: '#D4AF37' }}>(الأخير)</span>}</p>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-cream-muted">تاريخ الاستحقاق</p>
                  <p className="text-xs font-semibold" style={{ color: loan.status === 'overdue' ? '#DC2626' : '#F5F0E0' }}>{loan.nextDueDate}</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#1A2D4A' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: loan.status === 'overdue' ? '#DC2626' : 'linear-gradient(90deg, #D4AF37, #E5C84B)' }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: loan.status === 'overdue' ? '#DC2626' : '#D4AF37' }}>{Math.round(progress)}%</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button onClick={() => navigateToLoan(loan.id)} className="flex-1 py-2 rounded-lg text-xs font-bold text-center" style={{ background: '#1A2D4A', color: '#A3956B' }}>
                    التفاصيل
                  </button>
                  <button onClick={() => sendWhatsApp(borrower.phone, fillTemplate('tmpl-remind', { name: borrower.name, product: loan.productName, amount: fmt(nextInstallment), date: loan.nextDueDate }))}
                    className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                    تذكير
                  </button>
                  <button onClick={() => setPayLoanId(payLoanId === loan.id ? null : loan.id)} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ background: '#D4AF37', color: '#0A1628' }}>
                    تحصيل
                  </button>
                </div>

                {/* Payment Expandable Panel */}
                {payLoanId === loan.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 rounded-xl overflow-hidden" style={{ background: '#0A1628', border: '2px solid #059669' }}>
                    {/* Header */}
                    <div className="px-3 py-2 flex items-center justify-between" style={{ background: 'rgba(5, 150, 105, 0.15)' }}>
                      <span className="text-xs font-bold" style={{ color: '#059669' }}>تسجيل دفعة</span>
                      <span className="text-sm font-bold text-gold">{fmt(nextInstallment)} ر.س</span>
                    </div>
                    {/* Body */}
                    <div className="p-3">
                      <p className="text-xs text-cream-muted mb-2">طريقة الدفع</p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {([
                          ['cash', 'كاش', <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>],
                          ['transfer', 'تحويل', <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>],
                          ['bank', 'بنكي', <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" /></svg>],
                        ] as const).map(([key, label, icon]) => (
                          <button key={key} onClick={() => setPaymentMethod(key)} className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all"
                            style={{
                              background: paymentMethod === key ? '#059669' : '#111D32',
                              color: paymentMethod === key ? '#fff' : '#A3956B',
                              border: paymentMethod === key ? '2px solid #059669' : '2px solid rgba(212, 175, 55, 0.15)',
                              boxShadow: paymentMethod === key ? '0 2px 8px rgba(5, 150, 105, 0.25)' : 'none',
                            }}>
                            {icon}
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setPayLoanId(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ background: '#1A2D4A', color: '#A3956B' }}>إلغاء</button>
                        <button onClick={() => handleReceivePayment(loan.id)} disabled={isPaying} className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                          style={{ background: isPaying ? '#1A2D4A' : '#059669', color: '#fff', opacity: isPaying ? 0.7 : 1 }}>
                          {isPaying ? (
                            <><motion.div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }} /> جاري...</>
                          ) : (
                            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> تأكيد التحصيل</>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
          {activeLoans.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs text-cream-muted mb-2">لا توجد عقود نشطة لهذا العميل</p>
              <button onClick={() => navigateToScreen('addLoan')} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: '#D4AF37', color: '#0A1628' }}>+ إضافة عقد جديد</button>
            </div>
          )}
        </motion.div>

        {/* Payment History */}
        <motion.div variants={itemVariants} className="mt-3">
          <h3 className="text-sm font-bold text-cream mb-2">سجل الدفعات</h3>
          {borrowerPayments.slice(0, 8).map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.08)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(5, 150, 105, 0.1)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-cream">{fmt(p.amount)} ر.س</p>
                <p className="text-xs text-cream-muted">{p.date} | {p.method === 'cash' ? 'كاش' : p.method === 'transfer' ? 'تحويل' : 'بنكي'}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(10, 22, 40, 0.92)' }} onClick={() => setShowEdit(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#111D32', border: '2px solid #D4AF37' }} onClick={e => e.stopPropagation()}>
              <div className="p-4" style={{ background: 'rgba(212, 175, 55, 0.08)' }}><h2 className="text-base font-bold text-gold text-center">تعديل بيانات العميل</h2></div>
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                <EditField label="الاسم الكامل *" value={editName} onChange={setEditName} />
                <EditField label="رقم الجوال *" value={editPhone} onChange={setEditPhone} dir="ltr" />
                <EditField label="رقم الهوية" value={editIdNumber} onChange={setEditIdNumber} dir="ltr" />
                <EditField label="العنوان" value={editAddress} onChange={setEditAddress} />
                <div>
                  <label className="text-xs text-cream-muted block mb-1">تقييم العميل</label>
                  <div className="flex gap-2">
                    {([
                      ['trusted', 'موثوق', '#059669'],
                      ['average', 'متوسط', '#D4AF37'],
                      ['late', 'متأخر', '#DC2626']
                    ] as const).map(([key, label, color]) => (
                      <button key={key} onClick={() => setEditRating(key)} className="flex-1 py-2 rounded-lg text-xs font-bold"
                        style={{ background: editRating === key ? color : '#0A1628', color: editRating === key ? '#fff' : '#A3956B', border: editRating === key ? 'none' : '1px solid rgba(212, 175, 55, 0.15)' }}>{label}</button>
                    ))}
                  </div>
                </div>
                <EditField label="ملاحظات" value={editNotes} onChange={setEditNotes} textarea />
              </div>
              <div className="p-3 flex gap-2">
                <button onClick={() => setShowEdit(false)} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: '#1A2D4A', color: '#A3956B' }}>إلغاء</button>
                <button onClick={handleSave} disabled={!editName.trim() || !editPhone.trim()} className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: !editName.trim() || !editPhone.trim() ? '#1A2D4A' : '#D4AF37', color: !editName.trim() || !editPhone.trim() ? '#A3956B' : '#0A1628' }}>حفظ</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EditField({ label, value, onChange, dir, textarea }: { label: string; value: string; onChange: (v: string) => void; dir?: string; textarea?: boolean }) {
  return (
    <div>
      <label className="text-xs text-cream-muted block mb-1">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full py-2 px-3 rounded-xl outline-none text-xs resize-none" style={{ background: '#0A1628', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0', minHeight: '60px' }} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} className="w-full py-2.5 px-3 rounded-xl outline-none text-sm" style={{ background: '#0A1628', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0' }} dir={dir} />
      )}
    </div>
  );
}

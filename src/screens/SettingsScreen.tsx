import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { fmt } from '@/lib/format';
import { screenVariants, itemVariants } from '@/lib/animation';
import ScreenHeader from '@/components/ScreenHeader';
import ConfirmModal from '@/components/ConfirmModal';

export default function SettingsScreen() {
  const {
    currentUser, logout, borrowers, loans, payments,
    navigateBack, navigateToScreen, resetAllData,
    templates, updateTemplate, addTemplate, deleteTemplate,
    autoReminderSettings, updateAutoReminderSettings,
    subscription, plans, getUsageStats,
  } = useApp();

  const [showLogout, setShowLogout] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetOk, setResetOk] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [newName, setNewName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue').length;
  const hints = '{name} = اسم العميل، {product} = المنتج، {amount} = المبلغ، {date} = التاريخ';

  const handleReset = () => { resetAllData(); setShowReset(false); setResetOk(true); setTimeout(() => setResetOk(false), 2000); };



  if (!currentUser) {
    return (
      <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col items-center justify-center">
        <motion.div variants={itemVariants} className="text-center">
          <p className="text-sm text-cream-muted">يجب تسجيل الدخول أولاً</p>
          <button onClick={() => navigateToScreen('home')} className="mt-4 px-6 py-2 rounded-xl text-sm font-bold" style={{ background: '#D4AF37', color: '#0A1628' }}>الرئيسية</button>
        </motion.div>
      </motion.div>
    );
  }

  const plan = plans.find(p => p.id === subscription?.planId);
  const stats = getUsageStats();

  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <ScreenHeader title="إعدادات الحساب" onBack={navigateBack} />

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Profile */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mt-2">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960E)', color: '#0A1628' }}>{currentUser.name.charAt(0)}</div>
          <h2 className="text-lg font-bold text-cream mt-2">{currentUser.name}</h2>
          <p className="text-sm text-cream-muted">{currentUser.phone}</p>
          {currentUser.businessName && <span className="mt-1 px-3 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37' }}>{currentUser.businessName}</span>}
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="mt-4 grid grid-cols-3 gap-2">
          <StatCard label="العملاء" value={borrowers.length.toString()} />
          <StatCard label="العقود" value={activeLoans.toString()} />
          <StatCard label="المحصل" value={`${fmt(totalCollected)}`} gold />
        </motion.div>

        {/* Plan */}
        {plan && (
          <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <h3 className="text-sm font-bold text-gold mb-3">باقة الاشتراك</h3>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-base font-bold text-cream">{plan.name}</p>
                <p className="text-xs text-cream-muted">{plan.priceMonthly === 0 ? 'مجاني مدى الحياة' : `${plan.priceMonthly} ر.س/شهر`}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: subscription?.status === 'active' ? 'rgba(5,150,105,0.15)' : 'rgba(212,175,55,0.15)', color: subscription?.status === 'active' ? '#059669' : '#D4AF37' }}>
                {subscription?.status === 'active' ? 'نشط' : 'تجربة'}
              </span>
            </div>
            <button onClick={() => navigateToScreen('plans')} className="w-full py-2 rounded-xl text-xs font-bold" style={{ background: '#D4AF37', color: '#0A1628' }}>
              {plan.code === 'free' ? 'ترقية الباقة' : 'تغيير الباقة'}
            </button>
          </motion.div>
        )}

        {/* Usage */}
        <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
          <h3 className="text-sm font-bold text-cream mb-3">استهلاك الباقة</h3>
          <UsageBar label="العملاء" value={stats.borrowers} max={stats.maxBorrowers} />
          <UsageBar label="العقود النشطة" value={stats.loans} max={stats.maxLoans} />
          <UsageBar label="التذكيرات" value={stats.reminders} max={stats.maxReminders} />
        </motion.div>

        {/* Account */}
        <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
          <h3 className="text-sm font-bold text-cream mb-3">بيانات الحساب</h3>
          <InfoRow label="الاسم" value={currentUser.name} />
          <InfoRow label="الجوال" value={currentUser.phone || '—'} />
          <InfoRow label="البريد" value={currentUser.email || '—'} />
          <InfoRow label="النشاط التجاري" value={currentUser.businessName || '—'} />
        </motion.div>

        {/* Auto Reminder */}
        <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
              <h3 className="text-sm font-bold text-gold">التذكير التلقائي بالواتساب</h3>
            </div>
            <button onClick={() => updateAutoReminderSettings({ enabled: !autoReminderSettings.enabled })} className="relative w-12 h-6 rounded-full transition-colors" style={{ background: autoReminderSettings.enabled ? '#059669' : '#1A2D4A' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all" style={{ background: '#fff', right: autoReminderSettings.enabled ? '2px' : '26px' }} />
            </button>
          </div>
          {autoReminderSettings.enabled && (
            <>
              <div className="mb-3">
                <label className="text-xs text-cream-muted block mb-1.5">التنبيه قبل الاستحقاق بـ</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 5, 7].map(d => (
                    <button key={d} onClick={() => updateAutoReminderSettings({ daysBefore: d })} className="flex-1 py-2 rounded-lg text-xs font-bold transition-colors" style={{ background: autoReminderSettings.daysBefore === d ? '#D4AF37' : '#0A1628', color: autoReminderSettings.daysBefore === d ? '#0A1628' : '#A3956B', border: autoReminderSettings.daysBefore === d ? 'none' : '1px solid rgba(212, 175, 55, 0.2)' }}>
                      {d} {d === 1 ? 'يوم' : 'أيام'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3 p-3 rounded-xl" style={{ background: '#0A1628', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
                <label className="text-xs text-cream-muted block mb-1.5">مفتاح API — CallMeBot</label>
                <input type="text" value={autoReminderSettings.whatsappApiKey || ''} onChange={e => updateAutoReminderSettings({ whatsappApiKey: e.target.value.trim() })} placeholder="أدخل مفتاح API..." className="w-full py-2 px-3 rounded-lg outline-none text-xs" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0' }} />
                <p className="text-xs text-cream-muted mt-2">للحصول على المفتاح: أرسل رسالة لـ +34 621 13 18 84 تكتب فيها: I allow callmebot to send me messages</p>
              </div>
            </>
          )}
        </motion.div>

        {/* Templates */}
        <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
          <h3 className="text-sm font-bold mb-1" style={{ color: '#059669' }}>قوالب الرسائل</h3>
          <p className="text-xs text-cream-muted mb-3">{hints}</p>
          {templates.map(t => (
            <div key={t.id} className="mb-3 p-3 rounded-xl" style={{ background: '#0A1628', border: '1px solid rgba(212, 175, 55, 0.08)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-cream">{t.name}</span>
                <span className="text-xs text-cream-muted">{t.subject}</span>
              </div>
              {editId === t.id ? (
                <>
                  <textarea value={editBody} onChange={e => setEditBody(e.target.value)} className="w-full py-2 px-3 rounded-lg outline-none text-xs resize-none mt-1" style={{ background: '#111D32', border: '1px solid #D4AF37', color: '#F5F0E0', minHeight: '80px' }} />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { updateTemplate(t.id, { body: editBody }); setEditId(null); }} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: '#059669', color: '#fff' }}>حفظ</button>
                    <button onClick={() => setEditId(null)} className="px-3 py-1 rounded-lg text-xs" style={{ background: '#1A2D4A', color: '#A3956B' }}>إلغاء</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-cream-muted whitespace-pre-wrap">{t.body}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { setEditId(t.id); setEditBody(t.body); }} className="text-xs font-bold" style={{ color: '#D4AF37' }}>تعديل</button>
                    {!t.id.startsWith('tmpl-') && <button onClick={() => deleteTemplate(t.id)} className="text-xs" style={{ color: '#DC2626' }}>حذف</button>}
                  </div>
                </>
              )}
            </div>
          ))}
          {showAdd ? (
            <div className="mt-2 p-3 rounded-xl" style={{ background: '#0A1628', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full py-2 px-3 rounded-lg outline-none text-xs mb-2" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0' }} placeholder="اسم القالب" />
              <input value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full py-2 px-3 rounded-lg outline-none text-xs mb-2" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0' }} placeholder="عنوان الزر" />
              <textarea value={newBody} onChange={e => setNewBody(e.target.value)} className="w-full py-2 px-3 rounded-lg outline-none text-xs resize-none mb-2" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F5F0E0', minHeight: '60px' }} placeholder={`نص الرسالة... (${hints})`} />
              <div className="flex gap-2">
                <button onClick={() => { if (newName && newBody) { addTemplate({ name: newName, subject: newSubject || newName, body: newBody }); setNewName(''); setNewSubject(''); setNewBody(''); setShowAdd(false); } }} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: '#059669', color: '#fff' }}>إضافة</button>
                <button onClick={() => setShowAdd(false)} className="px-3 py-1 rounded-lg text-xs" style={{ background: '#1A2D4A', color: '#A3956B' }}>إلغاء</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} className="mt-2 py-2 rounded-xl text-xs font-bold w-full" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', border: '1px dashed rgba(5, 150, 105, 0.3)' }}>+ قالب جديد</button>
          )}
        </motion.div>

        {/* Backup */}
        <motion.div variants={itemVariants} className="mt-3 p-4 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#2563EB' }}>النسخ الاحتياطي</h3>
          <button onClick={() => navigateToScreen('backup')} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            إدارة النسخ الاحتياطي
          </button>
        </motion.div>

        {/* Danger */}
        <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: '#DC2626' }}>منطقة الخطر</h3>
          <button onClick={() => setShowReset(true)} className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-2" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
            حذف كل البيانات والبدأ من جديد
          </button>
          {resetOk && <p className="text-xs text-center mt-1" style={{ color: '#059669' }}>تمت إعادة التعيين بنجاح!</p>}
        </motion.div>

        {/* Logout */}
        <motion.div variants={itemVariants} className="mt-3 mb-2">
          <button onClick={() => setShowLogout(true)} className="w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2" style={{ background: '#111D32', color: '#DC2626', border: '2px solid #DC2626' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            تسجيل الخروج
          </button>
        </motion.div>
      </div>

      <ConfirmModal show={showReset} title="حذف كل البيانات؟" message="سيتم حذف جميع العملاء والعقود والدفعات بشكل نهائي." confirmLabel="حذف" icon="delete"
        onConfirm={handleReset} onCancel={() => setShowReset(false)} />

      <ConfirmModal show={showLogout} title="تسجيل الخروج؟" message="هل أنت متأكد من تسجيل الخروج؟" confirmLabel="خروج" icon="logout"
        onConfirm={logout} onCancel={() => setShowLogout(false)} />
    </motion.div>
  );
}

function UsageBar({ label, value, max }: { label: string; value: number; max: number }) {
  const isUnlimited = max === 999999;
  const pct = isUnlimited ? 0 : Math.min((value / max) * 100, 100);
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-cream-muted">{label}</span>
        <span className="text-xs font-bold" style={{ color: pct > 80 ? '#DC2626' : pct > 50 ? '#D4AF37' : '#059669' }}>
          {isUnlimited ? `${value} / ∞` : `${value} / ${max}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A2D4A' }}>
        <div className="h-full rounded-full" style={{ width: isUnlimited ? '0%' : `${pct}%`, background: pct > 80 ? '#DC2626' : pct > 50 ? '#D4AF37' : '#059669' }} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.08)' }}>
      <span className="text-xs text-cream-muted">{label}</span>
      <span className="text-sm font-bold text-cream">{value}</span>
    </div>
  );
}

function StatCard({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="p-2.5 rounded-xl text-center" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
      <p className="text-lg font-bold" style={{ color: gold ? '#D4AF37' : '#F5F0E0' }}>{value}</p>
      <p className="text-xs text-cream-muted">{label}</p>
    </div>
  );
}

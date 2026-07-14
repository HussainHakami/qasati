import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Toaster, toast } from 'sonner';
import { screenVariants, itemVariants } from '@/lib/animation';
export default function BackupScreen() {
  const {
    navigateBack,
    exportToJSON, importFromJSON,
    saveCloudBackup, getCloudBackups, loadCloudBackup, deleteCloudBackup,
    borrowers, loans, payments,
  } = useApp();
  const [label, setLabel] = useState('');
  const [cloudList, setCloudList] = useState(getCloudBackups());
  const [savedMsg, setSavedMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const refreshCloud = useCallback(() => setCloudList(getCloudBackups()), [getCloudBackups]);
  const handleExport = () => {
    const json = exportToJSON();
    if (!json) { toast.error('لا توجد بيانات للتصدير'); return; }
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qasati-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تحميل ملف النسخ الاحتياطي في مجلد التنزيلات');
    } catch { toast.error('فشل التصدير'); }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.loading('جاري الاستيراد...', { id: 'import' });
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const ok = importFromJSON(content);
      if (ok) { toast.success('تم استيراد البيانات بنجاح!', { id: 'import' }); refreshCloud(); }
      else { toast.error('فشل الاستيراد، الملف غير صالح', { id: 'import' }); }
    };
    reader.onerror = () => toast.error('فشل قراءة الملف', { id: 'import' });
    reader.readAsText(file);
    e.target.value = '';
  };
  const handleCloudSave = () => {
    const name = label.trim() || `نسخة ${new Date().toLocaleDateString('ar-SA')}`;
    saveCloudBackup(name);
    setLabel('');
    refreshCloud();
    setSavedMsg(`تم حفظ النسخة "${name}" في ذاكرة المتصفح`);
    setTimeout(() => setSavedMsg(''), 4000);
  };
  const handleCloudLoad = (id: string) => {
    const ok = loadCloudBackup(id);
    if (ok) toast.success('تم استعادة النسخة بنجاح!');
    else toast.error('فشل استعادة النسخة');
  };
  const handleCloudDelete = (id: string) => {
    deleteCloudBackup(id);
    refreshCloud();
    toast.success('تم حذف النسخة');
  };
  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#111D32', border: '1px solid #D4AF37', color: '#F5F0E0', fontFamily: 'Cairo' },
      }} />
      <motion.div variants={itemVariants} className="flex items-center gap-3 px-5 pt-4 pb-2">
        <button onClick={navigateBack} className="p-2 rounded-full" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 className="font-kufi text-xl font-bold text-gold">النسخ الاحتياطي</h1>
      </motion.div>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* Export / Import */}
        <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFileSelect} style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />
        <motion.div variants={itemVariants} className="mt-2 grid grid-cols-2 gap-3">
          <button onClick={handleExport} className="py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold" style={{ background: '#D4AF37', color: '#0A1628' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            تصدير كملف
          </button>
          <button onClick={() => fileRef.current?.click()} className="py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold" style={{ background: '#111D32', border: '2px solid #D4AF37', color: '#D4AF37' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            استيراد ملف
          </button>
        </motion.div>
        {/* Stats */}
        <motion.div variants={itemVariants} className="mt-3 p-3 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <p className="text-xs text-cream-muted mb-1">البيانات الحالية</p>
          <div className="flex gap-3">
            <span className="text-xs text-cream">{borrowers.length} عميل</span>
            <span className="text-xs text-cream">{loans.length} عقد</span>
            <span className="text-xs text-cream">{payments.length} دفعة</span>
          </div>
        </motion.div>
        {/* Divider */}
        <motion.div variants={itemVariants} className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(212, 175, 55, 0.15)' }} />
          <span className="text-xs text-cream-muted">النسخ السحابية (في المتصفح)</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(212, 175, 55, 0.15)' }} />
        </motion.div>
        {/* Save */}
        <motion.div variants={itemVariants}>
          <label className="text-sm text-cream-muted block mb-1.5">اسم النسخة</label>
          <div className="flex gap-2">
            <input value={label} onChange={e => setLabel(e.target.value)} className="flex-1 py-2.5 px-4 rounded-xl outline-none text-sm" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.3)', color: '#F5F0E0' }} placeholder={`نسخة ${new Date().toLocaleDateString('ar-SA')}`} />
            <button onClick={handleCloudSave} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#059669', color: '#fff' }}>حفظ</button>
          </div>
        </motion.div>
        {savedMsg && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-2.5 rounded-xl flex items-center gap-2" style={{ background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            <span className="text-xs font-medium" style={{ color: '#059669' }}>{savedMsg}</span>
          </motion.div>
        )}
        {/* List */}
        <motion.div variants={itemVariants} className="mt-3 space-y-2">
          {cloudList.length === 0 && <p className="text-xs text-cream-muted text-center py-4">لا توجد نسخ محفوظة</p>}
          {cloudList.map(b => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-cream truncate">{b.label}</p>
                <p className="text-xs text-cream-muted">{new Date(b.date).toLocaleDateString('ar-SA')} | الحجم: {b.size}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleCloudLoad(b.id)} className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(5, 150, 105, 0.15)', color: '#059669' }}>استعادة</button>
                <button onClick={() => handleCloudDelete(b.id)} className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>حذف</button>
              </div>
            </div>
          ))}
        </motion.div>
        <motion.p variants={itemVariants} className="text-xs text-cream-muted text-center mt-4">
          النسخة السحابية تُحفظ في ذاكرة المتصفح (localStorage)
          <br />
          التصدير يُنزّل ملف JSON في مجلد التنزيلات
        </motion.p>
      </div>
    </motion.div>
  );
}

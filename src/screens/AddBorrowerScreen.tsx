import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { screenVariants, itemVariants } from '@/lib/animation';
import ScreenHeader from '@/components/ScreenHeader';
import FormField from '@/components/FormField';

const ratings = [
  ['trusted', 'موثوق', '#059669'],
  ['average', 'متوسط', '#D4AF37'],
  ['late', 'متأخر', '#DC2626'],
] as const;



export default function AddBorrowerScreen() {
  const { navigateBack, addBorrower } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState<'trusted' | 'average' | 'late'>('average');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'اسم العميل مطلوب';
    if (!phone.trim() || phone.length < 8) e.phone = 'رقم الجوال مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    addBorrower({ name: name.trim(), phone, idNumber, address, avatar: '', rating, notes });
    setSuccess(true);
    setTimeout(() => { setSuccess(false); navigateBack(); }, 1200);
  };

  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <ScreenHeader title="عميل جديد" onBack={navigateBack} />
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <FormField label="الاسم الكامل *" value={name} onChange={setName} error={errors.name} />
        <FormField label="رقم الجوال *" value={phone} onChange={setPhone} error={errors.phone} dir="ltr" />
        <FormField label="رقم الهوية" value={idNumber} onChange={setIdNumber} />
        <FormField label="العنوان" value={address} onChange={setAddress} />

        <motion.div variants={itemVariants} className="mt-3">
          <label className="text-sm text-cream-muted block mb-1.5">التقييم</label>
          <div className="flex gap-2">
            {ratings.map(([key, label, color]) => (
              <button key={key} onClick={() => setRating(key as typeof rating)} className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: rating === key ? `${color}25` : '#111D32', color, border: rating === key ? `2px solid ${color}` : '2px solid rgba(212, 175, 55, 0.15)' }}>{label}</button>
            ))}
          </div>
        </motion.div>

        <FormField label="ملاحظات" value={notes} onChange={setNotes} textarea rows={3} placeholder="ملاحظات عن العميل..." />

        <motion.div variants={itemVariants} className="mt-4 mb-2">
          <SubmitButton onClick={handleSubmit} success={success} label="إضافة العميل" successLabel="تمت الإضافة!" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function SubmitButton({ onClick, success, label, successLabel }: { onClick: () => void; success: boolean; label: string; successLabel: string }) {
  return (
    <button onClick={onClick} className="w-full py-3.5 rounded-full font-bold text-base text-center transition-all"
      style={{ background: success ? '#059669' : '#D4AF37', color: success ? '#fff' : '#0A1628', border: success ? '4px solid #047857' : '4px solid #B8960E' }}>
      {success ? successLabel : label}
    </button>
  );
}

import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { screenVariants, itemVariants } from '@/lib/animation';
export default function PlansScreen() {
  const { plans, subscription, subscribeToPlan, navigateBack } = useApp();
  const currentPlanId = subscription?.planId;
  return (
    <motion.div variants={screenVariants} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col overflow-hidden">
      <motion.div variants={itemVariants} className="flex items-center gap-3 px-5 pt-4 pb-2">
        <button onClick={navigateBack} className="p-2 rounded-full" style={{ background: '#111D32', border: '2px solid rgba(212, 175, 55, 0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h1 className="font-kufi text-xl font-bold text-gold">باقات الاشتراك</h1>
      </motion.div>
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <motion.p variants={itemVariants} className="text-sm text-cream-muted text-center mb-4">
          اختر الباقة المناسبة لعملك — ترقية فورية
        </motion.p>
        <div className="space-y-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isFree = plan.code === 'free';
            return (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: isCurrent ? '#111D32' : '#0A1628',
                  border: isCurrent ? '2px solid #D4AF37' : '1px solid rgba(212, 175, 55, 0.15)',
                }}
              >
                {isCurrent && (
                  <div className="absolute top-0 left-0 right-0 py-1 text-center text-xs font-bold" style={{ background: '#D4AF37', color: '#0A1628' }}>
                    باقتك الحالية
                  </div>
                )}
                <div className="p-4" style={{ paddingTop: isCurrent ? '36px' : '16px' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-cream">{plan.name}</h3>
                    <div className="text-left">
                      <span className="text-2xl font-bold text-gold">{plan.priceMonthly === 0 ? 'مجاني' : `${plan.priceMonthly} ر.س`}</span>
                      {plan.priceMonthly > 0 && <span className="text-xs text-cream-muted mr-1">/شهر</span>}
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        <span className="text-xs text-cream">{f}</span>
                      </div>
                    ))}
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => subscribeToPlan(plan.code)}
                      className="w-full py-2.5 rounded-xl font-bold text-sm"
                      style={{ background: plan.code === 'free' ? '#1A2D4A' : '#D4AF37', color: plan.code === 'free' ? '#A3956B' : '#0A1628' }}
                    >
                      {isFree ? 'الاشتراك المجاني' : 'اشترك الآن'}
                    </button>
                  )}
                  {isCurrent && (
                    <div className="w-full py-2.5 rounded-xl font-bold text-sm text-center" style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                      ✅ أنت مشترك في هذه الباقة
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        <motion.div variants={itemVariants} className="mt-4 p-4 rounded-xl" style={{ background: '#111D32', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
          <p className="text-xs text-cream-muted text-center">
            💡 الباقة المجانية كافية للبدء. يمكنك الترقية في أي وقت من الإعدادات.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { trpc } from '@/providers/trpc';
import { secureGet, secureSet, secureRemove } from '@/lib/crypto';
import type { Borrower, Loan, Payment, Notification, MessageTemplate, Screen, AppScreenState, Plan, Subscription } from '@/types';

interface AppState {
  currentScreen: Screen;
  screenState: AppScreenState;
  currentUser: { name: string; phone?: string; email?: string; businessName?: string; createdAt?: string } | null;
  logout: () => void;
  navigateToBorrower: (id: string) => void;
  navigateToLoan: (id: string) => void;
  navigateToScreen: (screen: Screen) => void;
  navigateBack: () => void;

  borrowers: Borrower[];
  addBorrower: (b: Omit<Borrower, 'id' | 'createdAt' | 'userId'>) => void;
  updateBorrower: (id: string, data: Partial<Borrower>) => void;
  deleteBorrower: (id: string) => void;

  loans: Loan[];
  addLoan: (l: Omit<Loan, 'id' | 'createdAt' | 'monthlyPayment' | 'lastPayment' | 'status' | 'userId'> & { dueDay?: number }) => void;
  updateLoan: (id: string, data: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;

  payments: Payment[];
  receivePayment: (p: Omit<Payment, 'id' | 'date' | 'userId'>) => void;
  checkOverdueLoans: () => void;
  getOverdueDays: (nextDueDate: string) => number;

  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  unreadCount: number;

  resetAllData: () => void;

  // Backup
  exportToJSON: () => string;
  importFromJSON: (json: string) => boolean;
  saveCloudBackup: (label: string) => void;
  getCloudBackups: () => { id: string; label: string; date: string; size: string }[];
  loadCloudBackup: (id: string) => boolean;
  deleteCloudBackup: (id: string) => void;

  // Message Templates
  templates: MessageTemplate[];
  addTemplate: (t: Omit<MessageTemplate, 'id' | 'userId'>) => void;
  updateTemplate: (id: string, data: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;
  fillTemplate: (templateId: string, vars: Record<string, string>) => string;

  // Auto Reminder
  autoReminderSettings: { enabled: boolean; daysBefore: number; templateId: string; lastCheckDate?: string; whatsappApiKey?: string };
  updateAutoReminderSettings: (s: Partial<{ enabled: boolean; daysBefore: number; templateId: string; whatsappApiKey: string }>) => void;
  pendingReminders: { loanId: string; borrowerId: string; borrowerName: string; productName: string; amount: number; dueDate: string }[];
  checkAutoReminders: () => { loanId: string; borrowerId: string; borrowerName: string; productName: string; amount: number; dueDate: string }[];
  markReminderSent: (loanId: string) => void;

  // Toast
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // SaaS / Plans
  plans: Plan[];
  subscription: Subscription | null;
  subscribeToPlan: (planCode: string) => void;
  canAddBorrower: () => boolean;
  canAddLoan: () => boolean;
  canSendReminder: () => boolean;
  getUsageStats: () => { borrowers: number; maxBorrowers: number; loans: number; maxLoans: number; reminders: number; maxReminders: number };
}

const AppContext = createContext<AppState | null>(null);

function getUserKey(userId: string, key: string) { return `qasati_${userId}_${key}`; }

function loadUserData<T>(userId: string, key: string, fallback: T): T {
  return secureGet(getUserKey(userId, key), fallback);
}

function saveUserData<T>(userId: string, key: string, data: T) {
  secureSet(getUserKey(userId, key), data);
}

const emptyArr = <T,>(): T[] => [];

const defaultPlans: Plan[] = [
  { id: 'plan_free', name: 'مجاني', code: 'free', priceMonthly: 0, priceYearly: 0, maxBorrowers: 10, maxLoans: 10, maxReminders: 10, features: ['10 عملاء', '10 عقود', '10 تذكير/شهر', 'تقارير أساسية'] },
  { id: 'plan_basic', name: 'أساسي', code: 'basic', priceMonthly: 29, priceYearly: 290, maxBorrowers: 50, maxLoans: 50, maxReminders: 100, features: ['50 عميل', '50 عقد', '100 تذكير/شهر', 'تقارير متقدمة', 'تأكيد سداد تلقائي'] },
  { id: 'plan_pro', name: 'احترافي', code: 'pro', priceMonthly: 99, priceYearly: 990, maxBorrowers: 200, maxLoans: 200, maxReminders: 500, features: ['200 عميل', '200 عقد', '500 تذكير/شهر', 'تقارير PDF', 'تذكير تلقائي', 'دعم أولوية'] },
  { id: 'plan_business', name: 'تجاري', code: 'business', priceMonthly: 299, priceYearly: 2990, maxBorrowers: -1, maxLoans: -1, maxReminders: -1, features: ['عملاء غير محدود', 'عقود غير محدودة', 'تذكير غير محدود', 'تخصيص كامل', 'دعم 24/7'] },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, logout } = useAuth();
  const userId = authUser?.id ?? '';

  // tRPC queries — load from server
  const borrowerQuery = trpc.borrower.list.useQuery({ userId }, { enabled: userId !== '' });
  const loanQuery = trpc.loan.list.useQuery({ userId }, { enabled: userId !== '' });
  const paymentQuery = trpc.payment.list.useQuery({ userId }, { enabled: userId !== '' });

  // tRPC mutations — sync to server
  const createBorrower = trpc.borrower.create.useMutation();
  const createLoan = trpc.loan.create.useMutation();
  const createPayment = trpc.payment.create.useMutation();
  const deleteBorrowerMut = trpc.borrower.delete.useMutation();
  const deleteLoanMut = trpc.loan.delete.useMutation();

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [screenState, setScreenState] = useState<AppScreenState>({ previousScreen: 'home', borrowerId: null, loanId: null });
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  // SaaS state
  const [plans] = useState<Plan[]>(defaultPlans);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Navigation Stack
  const navStack = useRef<Screen[]>(['home']);

  // Load data
  useEffect(() => {
    if (!userId) { setDataLoaded(true); return; }
    const b = loadUserData<Borrower[]>(userId, 'borrowers', emptyArr());
    if (b.length === 0) {
      // Seed demo data
      seedDemoData(userId);
      // Load seeded data into state
      setBorrowers(loadUserData<Borrower[]>(userId, 'borrowers', emptyArr()));
      setLoans(loadUserData<Loan[]>(userId, 'loans', emptyArr()));
      setPayments(loadUserData<Payment[]>(userId, 'payments', emptyArr()));
      setNotifications(loadUserData<Notification[]>(userId, 'notifications', emptyArr()));
    } else {
      setBorrowers(b);
      setLoans(loadUserData<Loan[]>(userId, 'loans', emptyArr()));
      setPayments(loadUserData<Payment[]>(userId, 'payments', emptyArr()));
      setNotifications(loadUserData<Notification[]>(userId, 'notifications', emptyArr()));
    }
    setTemplates(loadUserData<MessageTemplate[]>(userId, 'templates', emptyArr()));
    setSubscription(loadUserData<Subscription | null>(userId, 'subscription', null));
    navStack.current = ['home'];
    setCurrentScreen('home');
    setScreenState({ previousScreen: 'home', borrowerId: null, loanId: null });
    setDataLoaded(true);
  }, [userId]);

  // Sync from server (tRPC) — merge with localStorage
  useEffect(() => {
    if (borrowerQuery.data && borrowerQuery.data.length > 0) {
      const localIds = new Set(borrowers.map(b => b.id));
      const serverItems = borrowerQuery.data as any[];
      const newFromServer = serverItems.filter((b: any) => !localIds.has(b.id)).map((b: any) => ({ ...b, avatar: b.avatar || '', createdAt: b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : '' } as Borrower));
      if (newFromServer.length > 0) setBorrowers(prev => [...prev, ...newFromServer]);
    }
  }, [borrowerQuery.data]);
  useEffect(() => {
    if (loanQuery.data && loanQuery.data.length > 0) {
      const localIds = new Set(loans.map(l => l.id));
      const serverItems = loanQuery.data as any[];
      const newFromServer = serverItems.filter((l: any) => !localIds.has(l.id)).map((l: any) => ({ ...l, notes: l.notes || '', createdAt: l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : '' } as Loan));
      if (newFromServer.length > 0) setLoans(prev => [...prev, ...newFromServer]);
    }
  }, [loanQuery.data]);
  useEffect(() => {
    if (paymentQuery.data && paymentQuery.data.length > 0) {
      const localIds = new Set(payments.map(p => p.id));
      const serverItems = paymentQuery.data as any[];
      const newFromServer = serverItems.filter((p: any) => !localIds.has(p.id)).map((p: any) => ({ ...p, notes: p.notes || '', createdAt: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '' } as Payment));
      if (newFromServer.length > 0) setPayments(prev => [...prev, ...newFromServer]);
    }
  }, [paymentQuery.data]);

  // Persist
  useEffect(() => { if (userId && dataLoaded) saveUserData(userId, 'borrowers', borrowers); }, [borrowers, userId, dataLoaded]);
  useEffect(() => { if (userId && dataLoaded) saveUserData(userId, 'loans', loans); }, [loans, userId, dataLoaded]);
  useEffect(() => { if (userId && dataLoaded) saveUserData(userId, 'payments', payments); }, [payments, userId, dataLoaded]);
  useEffect(() => { if (userId && dataLoaded) saveUserData(userId, 'notifications', notifications); }, [notifications, userId, dataLoaded]);
  useEffect(() => { if (userId && dataLoaded) saveUserData(userId, 'templates', templates); }, [templates, userId, dataLoaded]);
  useEffect(() => { if (userId && dataLoaded && subscription) saveUserData(userId, 'subscription', subscription); }, [subscription, userId, dataLoaded]);

  // Auto-create free subscription if none exists
  useEffect(() => {
    if (userId && dataLoaded && !subscription) {
      const freePlan = plans.find(p => p.code === 'free');
      if (freePlan) {
        const now = new Date();
        const end = new Date();
        end.setFullYear(end.getFullYear() + 100); // lifetime free
        setSubscription({
          id: `sub_${userId}`,
          userId,
          planId: freePlan.id,
          status: 'active',
          startDate: now.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          remindersUsedThisMonth: 0,
          monthResetAt: now.toISOString().split('T')[0],
        });
      }
    }
  }, [userId, dataLoaded, subscription, plans]);

  // Navigation
  const navigateToBorrower = useCallback((id: string) => {
    setScreenState(s => ({ ...s, borrowerId: id }));
    navStack.current.push('borrowerDetail');
    setCurrentScreen('borrowerDetail');
  }, []);

  const navigateToLoan = useCallback((id: string) => {
    setScreenState(s => ({ ...s, loanId: id }));
    navStack.current.push('loanDetail');
    setCurrentScreen('loanDetail');
  }, []);

  const navigateToScreen = useCallback((screen: Screen) => {
    if (['home', 'borrowers', 'loans', 'reports', 'calculator'].includes(screen)) {
      navStack.current = [screen];
    } else {
      navStack.current.push(screen);
    }
    setCurrentScreen(screen);
  }, []);

  const navigateBack = useCallback(() => {
    if (navStack.current.length > 1) {
      navStack.current.pop();
      setCurrentScreen(navStack.current[navStack.current.length - 1]);
    }
  }, []);

  // Toast
  const addToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}`;
    setToasts(prev => [...prev, { id, message: msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // SaaS helpers
  const currentPlan = plans.find(p => p.id === subscription?.planId) ?? plans[0];

  const canAddBorrower = useCallback(() => {
    return currentPlan.maxBorrowers === -1 || borrowers.length < currentPlan.maxBorrowers;
  }, [currentPlan, borrowers]);

  const canAddLoan = useCallback(() => {
    return currentPlan.maxLoans === -1 || loans.filter(l => l.status === 'active' || l.status === 'overdue').length < currentPlan.maxLoans;
  }, [currentPlan, loans]);

  const canSendReminder = useCallback(() => {
    return currentPlan.maxReminders === -1 || (subscription?.remindersUsedThisMonth ?? 0) < currentPlan.maxReminders;
  }, [currentPlan, subscription]);

  const getUsageStats = useCallback(() => ({
    borrowers: borrowers.length,
    maxBorrowers: currentPlan.maxBorrowers === -1 ? 999999 : currentPlan.maxBorrowers,
    loans: loans.filter(l => l.status === 'active' || l.status === 'overdue').length,
    maxLoans: currentPlan.maxLoans === -1 ? 999999 : currentPlan.maxLoans,
    reminders: subscription?.remindersUsedThisMonth ?? 0,
    maxReminders: currentPlan.maxReminders === -1 ? 999999 : currentPlan.maxReminders,
  }), [borrowers, loans, subscription, currentPlan]);

  const subscribeToPlan = useCallback((planCode: string) => {
    const plan = plans.find(p => p.code === planCode);
    if (!plan || !userId) return;
    const now = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    const sub: Subscription = {
      id: `sub_${userId}_${planCode}`,
      userId,
      planId: plan.id,
      status: planCode === 'free' ? 'active' : 'trial',
      startDate: now.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      remindersUsedThisMonth: 0,
      monthResetAt: now.toISOString().split('T')[0],
    };
    setSubscription(sub);
    saveUserData(userId, 'subscription', sub);
    addToast(`تم الاشتراك في باقة ${plan.name}`, 'success');
  }, [plans, userId, addToast]);

  // Borrowers
  const addBorrower = useCallback((data: Omit<Borrower, 'id' | 'createdAt' | 'userId'>) => {
    if (!userId) return;
    if (!canAddBorrower()) { addToast('لقد وصلت للحد الأقصى من العملاء في باقتك', 'error'); return; }
    const newB: Borrower = { ...data, userId, id: `b${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
    setBorrowers(prev => [newB, ...prev]);
    // Sync to server
    createBorrower.mutate({ userId, ...data });
  }, [userId, canAddBorrower, addToast, createBorrower]);

  const updateBorrower = useCallback((id: string, data: Partial<Borrower>) => {
    setBorrowers(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  }, []);

  const deleteBorrower = useCallback((id: string) => {
    setBorrowers(prev => prev.filter(b => b.id !== id));
    setLoans(prev => prev.filter(l => l.borrowerId !== id));
    setPayments(prev => prev.filter(p => p.borrowerId !== id));
    // Sync to server
    deleteBorrowerMut.mutate({ id, userId });
  }, [deleteBorrowerMut, userId]);

  // Loans
  const addLoan = useCallback((data: Omit<Loan, 'id' | 'createdAt' | 'monthlyPayment' | 'lastPayment' | 'status' | 'userId'> & { dueDay?: number }) => {
    if (!userId) return;
    if (!canAddLoan()) { addToast('لقد وصلت للحد الأقصى من العقود في باقتك', 'error'); return; }
    const day = data.dueDay ?? 1;
    // Calculate total contract value first, then split evenly
    const totalContract = Math.round(data.amount * (1 + data.interestRate / 100));
    const monthlyPayment = Math.floor(totalContract / data.monthsTotal);
    const lastPayment = totalContract - (monthlyPayment * (data.monthsTotal - 1));
    const now = new Date();
    const startDateStr = now.toISOString().split('T')[0];
    // First due date = startDate + 1 month (fixed schedule)
    const firstDue = new Date(now.getFullYear(), now.getMonth() + 1, day);
    const nextDueStr = `${firstDue.getDate()} ${firstDue.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}`;
    const newLoan: Loan = { ...data, startDate: startDateStr, dueDay: day, userId, id: `l${Date.now()}`, monthlyPayment, lastPayment, status: 'active', nextDueDate: nextDueStr, createdAt: startDateStr };
    setLoans(prev => [newLoan, ...prev]);
    addToast('تم إضافة العقد بنجاح', 'success');
    // Sync to server
    createLoan.mutate({ userId, borrowerId: data.borrowerId, borrowerName: data.borrowerName, productName: data.productName, amount: data.amount, monthlyPayment, lastPayment, monthsTotal: data.monthsTotal, startDate: startDateStr, nextDueDate: nextDueStr, dueDay: day, interestRate: data.interestRate || 0, notes: data.notes || undefined });
  }, [userId, canAddLoan, addToast, createLoan]);

  const updateLoan = useCallback((id: string, data: Partial<Loan>) => {
    setLoans(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  }, []);

  const deleteLoan = useCallback((id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
    setPayments(prev => prev.filter(p => p.loanId !== id));
    // Sync to server
    deleteLoanMut.mutate({ id, userId });
  }, [deleteLoanMut, userId]);

  // Payments
  const receivePayment = useCallback((data: Omit<Payment, 'id' | 'date' | 'userId'>) => {
    if (!userId) return;
    const today = new Date();
    // Determine actual payment amount based on which installment this is
    const loan = loans.find(l => l.id === data.loanId);
    const actualAmount = loan && loan.monthsPaid + 1 >= loan.monthsTotal && loan.lastPayment
      ? loan.lastPayment
      : data.amount;
    const newP: Payment = { ...data, amount: actualAmount, userId, id: `p${Date.now()}`, date: today.toISOString().split('T')[0] };
    setPayments(prev => [newP, ...prev]);
    // Sync to server
    createPayment.mutate({ userId, loanId: data.loanId, borrowerId: data.borrowerId, borrowerName: data.borrowerName, amount: actualAmount, method: data.method || 'cash', date: today.toISOString().split('T')[0], notes: data.notes || undefined });
    setLoans(prev => prev.map(l => {
      if (l.id === data.loanId) {
        const newMonthsPaid = l.monthsPaid + 1;
        let nextDueDate = '—';
        if (newMonthsPaid < l.monthsTotal) {
          // Fixed schedule: startDate + monthsPaid months
          const [sy, sm, sd] = l.startDate.split('-').map(Number);
          const base = new Date(sy, sm - 1 + newMonthsPaid, 1);
          const dueD = l.dueDay || (typeof sd === 'number' ? sd : parseInt(sd as string)) || 1;
          // Clamp to last day of month if dueDay exceeds month length
          const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
          const finalDay = Math.min(dueD, lastDay);
          const nextDue = new Date(base.getFullYear(), base.getMonth(), finalDay);
          nextDueDate = `${finalDay} ${nextDue.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}`;
        } else { nextDueDate = '—'; }
        return { ...l, monthsPaid: newMonthsPaid, nextDueDate, status: newMonthsPaid >= l.monthsTotal ? 'paid' : 'active' };
      }
      return l;
    }));
  }, [userId, loans]);

  // Get overdue days
  const getOverdueDays = useCallback((nextDueDate: string): number => {
    if (nextDueDate === '—') return 0;
    try {
      const parts = nextDueDate.split(' ');
      if (parts.length >= 3) {
        const day = parseInt(parts[0]);
        const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
        const month = monthNames.indexOf(parts[1]);
        const year = parseInt(parts[2]);
        if (month >= 0) {
          const due = new Date(year, month, day);
          const diff = Date.now() - due.getTime();
          return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
        }
      }
    } catch { /* ignore */ }
    return 0;
  }, []);

  // Check overdue loans
  const checkOverdueLoans = useCallback(() => {
    const today = new Date();
    setLoans(prev => prev.map(l => {
      if (l.status !== 'active' || l.nextDueDate === '—') return l;
      try {
        const parts = l.nextDueDate.split(' ');
        if (parts.length >= 3) {
          const day = parseInt(parts[0]);
          const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
          const month = monthNames.indexOf(parts[1]);
          const year = parseInt(parts[2]);
          if (month >= 0) {
            const dueDate = new Date(year, month, day);
            if (dueDate < today) return { ...l, status: 'overdue' as const };
          }
        }
      } catch { /* ignore */ }
      return l;
    }));
  }, []);

  // Auto Reminder
  const [pendingReminders, setPendingReminders] = useState<{ loanId: string; borrowerId: string; borrowerName: string; productName: string; amount: number; dueDate: string }[]>([]);

  const checkAutoReminders = useCallback(() => {
    if (!subscription || !currentPlan) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysBefore = subscription ? 1 : 1; // default
    const checkWindow = new Date(today);
    checkWindow.setDate(checkWindow.getDate() + daysBefore);

    const pending: { loanId: string; borrowerId: string; borrowerName: string; productName: string; amount: number; dueDate: string }[] = [];
    loans.forEach(loan => {
      if (loan.status !== 'active' || loan.nextDueDate === '—') return;
      try {
        const parts = loan.nextDueDate.split(' ');
        if (parts.length >= 3) {
          const day = parseInt(parts[0]);
          const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
          const month = monthNames.indexOf(parts[1]);
          const year = parseInt(parts[2]);
          if (month >= 0) {
            const dueDate = new Date(year, month, day);
            if (dueDate >= today && dueDate <= checkWindow) {
              const alreadySent = loadUserData<boolean>(userId, `reminder_sent_${loan.id}_${loan.nextDueDate}`, false);
              if (!alreadySent) {
                pending.push({ loanId: loan.id, borrowerId: loan.borrowerId, borrowerName: loan.borrowerName, productName: loan.productName, amount: loan.monthlyPayment, dueDate: loan.nextDueDate });
              }
            }
          }
        }
      } catch { /* ignore */ }
    });
    setPendingReminders(pending);
    return pending;
  }, [loans, subscription, currentPlan, userId]);

  const markReminderSent = useCallback((loanId: string) => {
    setPendingReminders(prev => prev.filter(p => p.loanId !== loanId));
  }, []);

  // Check overdue on data load
  useEffect(() => {
    if (dataLoaded && loans.length > 0) {
      const timer = setTimeout(() => checkOverdueLoans(), 500);
      return () => clearTimeout(timer);
    }
  }, [dataLoaded, checkOverdueLoans]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const resetAllData = useCallback(() => {
    if (!userId) return;
    ['borrowers', 'loans', 'payments', 'notifications', 'templates', 'subscription'].forEach(key => {
      secureRemove(getUserKey(userId, key));
    });
    setBorrowers([]); setLoans([]); setPayments([]); setNotifications([]);
    // Reset to free plan
    subscribeToPlan('free');
  }, [userId, subscribeToPlan]);

  // Templates
  useEffect(() => {
    if (!userId) return;
    const loaded = loadUserData<MessageTemplate[]>(userId, 'templates', []);
    if (loaded.length === 0) {
      const defs: MessageTemplate[] = [
        { id: 'tmpl-remind', userId, name: 'تذكير بالقسط', subject: 'تذكير واتساب', body: 'السلام عليكم {name} 👋\n\nتذكير بقسطك المستحق على: {product}\nالمبلغ: {amount} ر.س\nتاريخ الاستحقاق: {date}\n\nيرجى التسديد في الموعد. شكراً لتعاونكم 🙏' },
        { id: 'tmpl-confirm', userId, name: 'تأكيد السداد', subject: 'تأكيد سداد', body: 'السلام عليكم {name} 👋\n\nتم استلام دفعتك بقيمة: {amount} ر.س\nللعقد: {product}\nالتاريخ: {date}\n\nشكراً لالتزامك بالسداد 🙏' },
      ];
      setTemplates(defs);
      saveUserData(userId, 'templates', defs);
    } else setTemplates(loaded);
  }, [userId]);

  useEffect(() => { if (userId && templates.length > 0) saveUserData(userId, 'templates', templates); }, [templates, userId]);

  const addTemplate = useCallback((data: Omit<MessageTemplate, 'id' | 'userId'>) => {
    if (!userId) return;
    const t: MessageTemplate = { ...data, id: `tmpl${Date.now()}`, userId };
    setTemplates(prev => [...prev, t]);
  }, [userId]);

  const updateTemplate = useCallback((id: string, data: Partial<MessageTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const fillTemplate = useCallback((templateId: string, vars: Record<string, string>): string => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return '';
    let result = tmpl.body;
    Object.entries(vars).forEach(([key, val]) => { result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val); });
    return result;
  }, [templates]);

  // Auto reminder settings
  const [autoReminderSettings, setAutoReminderSettings] = useState({ enabled: false, daysBefore: 1, templateId: 'tmpl-remind', whatsappApiKey: '', lastCheckDate: '' });
  useEffect(() => {
    if (!userId) return;
    const s = loadUserData(userId, 'auto_reminder', { enabled: false, daysBefore: 1, templateId: 'tmpl-remind', whatsappApiKey: '', lastCheckDate: '' });
    setAutoReminderSettings(s);
  }, [userId]);
  useEffect(() => { if (userId) saveUserData(userId, 'auto_reminder', autoReminderSettings); }, [autoReminderSettings, userId]);

  const updateAutoReminderSettings = useCallback((s: Partial<{ enabled: boolean; daysBefore: number; templateId: string; whatsappApiKey: string }>) => {
    setAutoReminderSettings(prev => ({ ...prev, ...s }));
  }, []);

  // Backup
  const exportToJSON = useCallback(() => {
    if (!userId) return '';
    return JSON.stringify({ version: '2.0', app: 'qasati-lender', exportDate: new Date().toISOString(), data: { borrowers, loans, payments, notifications, subscription } }, null, 2);
  }, [userId, borrowers, loans, payments, notifications, subscription]);

  const importFromJSON = useCallback((json: string): boolean => {
    if (!userId) return false;
    try {
      const parsed = JSON.parse(json);
      if (!parsed.data) return false;
      const d = parsed.data;
      if (d.borrowers) { setBorrowers(d.borrowers); saveUserData(userId, 'borrowers', d.borrowers); }
      if (d.loans) { setLoans(d.loans); saveUserData(userId, 'loans', d.loans); }
      if (d.payments) { setPayments(d.payments); saveUserData(userId, 'payments', d.payments); }
      if (d.notifications) { setNotifications(d.notifications); saveUserData(userId, 'notifications', d.notifications); }
      if (d.subscription) { setSubscription(d.subscription); saveUserData(userId, 'subscription', d.subscription); }
      return true;
    } catch { return false; }
  }, [userId]);

  const saveCloudBackup = useCallback((label: string) => {
    if (!userId) return;
    const payload = { id: `cb${Date.now()}`, label, date: new Date().toISOString(), data: { borrowers, loans, payments, notifications } };
    const existing = loadUserData<{ id: string; label: string; date: string; data: unknown }[]>(userId, 'cloud_backups', []);
    existing.unshift(payload);
    if (existing.length > 20) existing.length = 20;
    saveUserData(userId, 'cloud_backups', existing);
  }, [userId, borrowers, loans, payments, notifications]);

  const getCloudBackups = useCallback((): { id: string; label: string; date: string; size: string }[] => {
    if (!userId) return [];
    const items = loadUserData<{ id: string; label: string; date: string; data: unknown }[]>(userId, 'cloud_backups', []);
    return items.map(i => { const size = new Blob([JSON.stringify(i.data)]).size; return { id: i.id, label: i.label, date: i.date, size: size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B` }; });
  }, [userId]);

  const loadCloudBackup = useCallback((id: string): boolean => {
    if (!userId) return false;
    const existing = loadUserData<{ id: string; data: { borrowers: Borrower[]; loans: Loan[]; payments: Payment[]; notifications: Notification[] } }[]>(userId, 'cloud_backups', []);
    const found = existing.find(b => b.id === id);
    if (!found) return false;
    const d = found.data;
    setBorrowers(d.borrowers); saveUserData(userId, 'borrowers', d.borrowers);
    setLoans(d.loans); saveUserData(userId, 'loans', d.loans);
    setPayments(d.payments); saveUserData(userId, 'payments', d.payments);
    setNotifications(d.notifications); saveUserData(userId, 'notifications', d.notifications);
    return true;
  }, [userId]);

  const deleteCloudBackup = useCallback((id: string) => {
    if (!userId) return;
    const existing = loadUserData<{ id: string }[]>(userId, 'cloud_backups', []);
    saveUserData(userId, 'cloud_backups', existing.filter(b => b.id !== id));
  }, [userId]);

  return (
    <AppContext.Provider value={{
      currentScreen, screenState,
      currentUser: authUser ? { name: authUser.name, email: authUser.email || undefined, businessName: (authUser as any).businessName || undefined } : null,
      logout,
      navigateToBorrower, navigateToLoan, navigateToScreen, navigateBack,
      borrowers, addBorrower, updateBorrower, deleteBorrower,
      loans, addLoan, updateLoan, deleteLoan,
      payments, receivePayment, checkOverdueLoans, getOverdueDays,
      notifications, markNotificationRead, unreadCount,
      resetAllData,
      exportToJSON, importFromJSON,
      saveCloudBackup, getCloudBackups, loadCloudBackup, deleteCloudBackup,
      templates, addTemplate, updateTemplate, deleteTemplate, fillTemplate,
      autoReminderSettings, updateAutoReminderSettings, pendingReminders, checkAutoReminders, markReminderSent,
      toasts, addToast, removeToast,
      plans, subscription, subscribeToPlan,
      canAddBorrower, canAddLoan, canSendReminder, getUsageStats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

function seedDemoData(userId: string) {
  const demoB: Borrower[] = [
    { id: 'b1', userId, name: 'خالد السبيعي', phone: '0501234567', idNumber: '1098765432', address: 'الرياض، حي النسيم', avatar: '', rating: 'trusted', notes: 'عميل منتظم', createdAt: '2025-06-01' },
    { id: 'b2', userId, name: 'فهد العتيبي', phone: '0559876543', idNumber: '1122334455', address: 'جدة، حي الصفا', avatar: '', rating: 'average', notes: '', createdAt: '2025-08-15' },
    { id: 'b3', userId, name: 'سعد القحطاني', phone: '0544567890', idNumber: '2233445566', address: 'الدمام، حي الفيصلية', avatar: '', rating: 'trusted', notes: 'دفعات مبكرة', createdAt: '2025-09-20' },
    { id: 'b4', userId, name: 'ناصر الدوسري', phone: '0567890123', idNumber: '3344556677', address: 'الرياض، حي الملز', avatar: '', rating: 'late', notes: 'يتأخر أحياناً', createdAt: '2025-11-01' },
    { id: 'b5', userId, name: 'عبدالله المطيري', phone: '0532109876', idNumber: '4455667788', address: 'مكة، حي العزيزية', avatar: '', rating: 'trusted', notes: '', createdAt: '2026-01-10' },
  ];
  const demoL: Loan[] = [
    // l1: 5500, 0%, 12mo → ceil(5500/12) = 459
    // l1: 5500, 0%, 12mo → total=5500, floor(5500/12)=458, last=5500-458*11=462
    { id: 'l1', userId, borrowerId: 'b1', borrowerName: 'خالد السبيعي', productName: 'آيفون 15 برو ماكس', amount: 5500, monthlyPayment: 458, lastPayment: 462, monthsTotal: 12, monthsPaid: 8, startDate: '2025-10-01', nextDueDate: '1 أغسطس 2026', dueDay: 1, interestRate: 0, status: 'active', notes: '', createdAt: '2025-10-01' },
    // l2: 8500, 5%, 12mo → total=8925, floor(8925/12)=743, last=8925-743*11=752
    { id: 'l2', userId, borrowerId: 'b2', borrowerName: 'فهد العتيبي', productName: 'ماك بوك برو M3', amount: 8500, monthlyPayment: 743, lastPayment: 752, monthsTotal: 12, monthsPaid: 3, startDate: '2026-04-01', nextDueDate: '1 أغسطس 2026', dueDay: 1, interestRate: 5, status: 'active', notes: '', createdAt: '2026-04-01' },
    // l3: 4000, 0%, 12mo → total=4000, floor(4000/12)=333, last=4000-333*11=337
    { id: 'l3', userId, borrowerId: 'b3', borrowerName: 'سعد القحطاني', productName: 'طقم كنب مودرن', amount: 4000, monthlyPayment: 333, lastPayment: 337, monthsTotal: 12, monthsPaid: 11, startDate: '2025-08-01', nextDueDate: '1 أغسطس 2026', dueDay: 1, interestRate: 0, status: 'active', notes: '', createdAt: '2025-08-01' },
    // l4: 5000, 8%, 10mo → total=5400, floor(5400/10)=540, last=5400-540*9=540
    { id: 'l4', userId, borrowerId: 'b4', borrowerName: 'ناصر الدوسري', productName: 'تلفزيون سامسونج 75"', amount: 5000, monthlyPayment: 540, lastPayment: 540, monthsTotal: 10, monthsPaid: 2, startDate: '2026-05-15', nextDueDate: '15 أغسطس 2026', dueDay: 15, interestRate: 8, status: 'overdue', notes: '', createdAt: '2026-05-15' },
    // l5: 2500, 0%, 6mo → total=2500, floor(2500/6)=416, last=2500-416*5=420
    { id: 'l5', userId, borrowerId: 'b5', borrowerName: 'عبدالله المطيري', productName: 'سماعات AirPods Max', amount: 2500, monthlyPayment: 416, lastPayment: 420, monthsTotal: 6, monthsPaid: 6, startDate: '2026-01-01', nextDueDate: '—', dueDay: 1, interestRate: 0, status: 'paid', notes: '', createdAt: '2026-01-01' },
    // l6: 4500, 0%, 6mo → total=4500, floor(4500/6)=750, last=4500-750*5=750
    { id: 'l6', userId, borrowerId: 'b1', borrowerName: 'خالد السبيعي', productName: 'آيباد برو', amount: 4500, monthlyPayment: 750, lastPayment: 750, monthsTotal: 6, monthsPaid: 4, startDate: '2026-03-01', nextDueDate: '1 أغسطس 2026', dueDay: 1, interestRate: 0, status: 'active', notes: '', createdAt: '2026-03-01' },
  ];
  const demoP: Payment[] = [
    { id: 'p1', userId, loanId: 'l1', borrowerId: 'b1', borrowerName: 'خالد السبيعي', amount: 459, date: '2025-11-01', method: 'cash', notes: '' },
    { id: 'p2', userId, loanId: 'l1', borrowerId: 'b1', borrowerName: 'خالد السبيعي', amount: 459, date: '2025-12-01', method: 'transfer', notes: '' },
    { id: 'p3', userId, loanId: 'l1', borrowerId: 'b1', borrowerName: 'خالد السبيعي', amount: 459, date: '2026-01-01', method: 'cash', notes: '' },
    { id: 'p9', userId, loanId: 'l2', borrowerId: 'b2', borrowerName: 'فهد العتيبي', amount: 744, date: '2026-05-01', method: 'cash', notes: '' },
    { id: 'p12', userId, loanId: 'l4', borrowerId: 'b4', borrowerName: 'ناصر الدوسري', amount: 540, date: '2026-06-15', method: 'cash', notes: '' },
  ];
  const demoN: Notification[] = [
    { id: 'n1', userId, type: 'overdue', message: 'ناصر الدوسري متأخر عن سداد قسط بقيمة 500 ر.س', date: '2026-07-16', read: false, relatedId: 'l4' },
    { id: 'n2', userId, type: 'upcoming', message: 'قسط خالد السبيعي (آيفون) مستحق غداً: 458 ر.س', date: '2026-07-31', read: false, relatedId: 'l1' },
    { id: 'n3', userId, type: 'loan_completed', message: 'تم سداد عقد عبدالله المطيري بالكامل!', date: '2026-06-01', read: true, relatedId: 'l5' },
  ];
  saveUserData(userId, 'borrowers', demoB);
  saveUserData(userId, 'loans', demoL);
  saveUserData(userId, 'payments', demoP);
  saveUserData(userId, 'notifications', demoN);
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

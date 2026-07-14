// ===== USER (المقرض) =====
export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessName: string;
  password: string;
  createdAt: string;
}

// ===== BORROWER (المقترض/العميل) =====
export interface Borrower {
  id: string;
  userId: string;
  name: string;
  phone: string;
  idNumber: string;
  address: string;
  avatar: string;
  rating: 'trusted' | 'average' | 'late';
  notes: string;
  createdAt: string;
}

// ===== LOAN (العقد) =====
export interface Loan {
  id: string;
  userId: string;
  borrowerId: string;
  borrowerName: string;
  productName: string;
  amount: number;
  monthlyPayment: number;
  lastPayment: number;
  monthsTotal: number;
  monthsPaid: number;
  startDate: string;
  nextDueDate: string;
  dueDay: number;
  interestRate: number;
  status: 'active' | 'paid' | 'overdue' | 'pending';
  notes: string;
  createdAt: string;
}

// ===== PAYMENT (الدفعة المستلمة) =====
export interface Payment {
  id: string;
  userId: string;
  loanId: string;
  borrowerId: string;
  borrowerName: string;
  amount: number;
  date: string;
  method: 'cash' | 'transfer' | 'bank';
  notes: string;
}

// ===== NOTIFICATION =====
export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;       // "تذكير بالقسط", "تأكيد السداد"
  subject: string;    // what the button shows
  body: string;       // the message with placeholders like {name}, {product}, {amount}, {date}
}

export interface Notification {
  id: string;
  userId: string;
  type: 'payment_received' | 'overdue' | 'upcoming' | 'loan_completed';
  message: string;
  date: string;
  read: boolean;
  relatedId?: string;
}

export type Screen =
  | 'home'
  | 'borrowers'
  | 'loans'
  | 'reports'
  | 'calculator'
  | 'addBorrower'
  | 'addLoan'
  | 'borrowerDetail'
  | 'loanDetail'
  | 'notifications'
  | 'receivePayment'
  | 'settings'
  | 'backup'
  | 'plans'
  | 'report';

export interface AppScreenState {
  previousScreen: Screen;
  borrowerId: string | null;
  loanId: string | null;
}

// ===== SAAS / PLANS =====
export interface Plan {
  id: string;
  name: string;
  code: string;
  priceMonthly: number;
  priceYearly: number;
  maxBorrowers: number;
  maxLoans: number;
  maxReminders: number;
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate: string;
  remindersUsedThisMonth: number;
  monthResetAt: string;
}

// ===== AUTO REMINDER =====
export interface AutoReminderSettings {
  enabled: boolean;
  daysBefore: number;      // 1 to 7 days before due date
  templateId: string;      // which MessageTemplate to use
  lastCheckDate?: string;  // ISO date of last check
  whatsappApiKey?: string; // CallMeBot API key for auto-send
}

export interface SentReminderLog {
  loanId: string;
  borrowerId: string;
  borrowerName: string;
  productName: string;
  amount: number;
  dueDate: string;
  sentAt: string;          // ISO date
  templateId: string;
}

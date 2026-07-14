import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider, useApp } from '@/context/AppContext';
import { TRPCProvider } from '@/providers/trpc';
import AnimatedGridBackground from '@/components/AnimatedGridBackground';
import BottomNav from '@/components/BottomNav';
import LoginScreen from '@/screens/LoginScreen';
import HomeScreen from '@/screens/HomeScreen';
import BorrowersScreen from '@/screens/BorrowersScreen';
import LoansScreen from '@/screens/LoansScreen';
import ReportsScreen from '@/screens/ReportsScreen';
import CalculatorScreen from '@/screens/CalculatorScreen';
import AddBorrowerScreen from '@/screens/AddBorrowerScreen';
import AddLoanScreen from '@/screens/AddLoanScreen';
import BorrowerDetailScreen from '@/screens/BorrowerDetailScreen';
import LoanDetailScreen from '@/screens/LoanDetailScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import ReceivePaymentScreen from '@/screens/ReceivePaymentScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import BackupScreen from '@/screens/BackupScreen';
import PlansScreen from '@/screens/PlansScreen';
import ReportScreen from '@/screens/ReportScreen';
import type { Screen } from '@/types';

const mainScreens: Screen[] = ['home', 'borrowers', 'loans', 'reports', 'calculator'];

function ScreenRouter() {
  const { currentScreen } = useApp();

  const screens: Record<Screen, React.ReactNode> = {
    home: <HomeScreen />,
    borrowers: <BorrowersScreen />,
    loans: <LoansScreen />,
    reports: <ReportsScreen />,
    calculator: <CalculatorScreen />,
    addBorrower: <AddBorrowerScreen />,
    addLoan: <AddLoanScreen />,
    borrowerDetail: <BorrowerDetailScreen />,
    loanDetail: <LoanDetailScreen />,
    notifications: <NotificationsScreen />,
    receivePayment: <ReceivePaymentScreen />,
    settings: <SettingsScreen />,
    backup: <BackupScreen />,
    plans: <PlansScreen />,
    report: <ReportScreen />,
  };

  return <div className="h-full">{screens[currentScreen] || <HomeScreen />}</div>;
}

function AppContent() {
  const { isLoggedIn, isLoading } = useAuth();
  const { currentScreen } = useApp();

  // Loading
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#0A1628' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960E)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <p className="text-sm font-bold text-gold">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  // Login
  if (!isLoggedIn) {
    return (
      <div className="h-screen w-screen overflow-hidden relative" style={{ background: '#0A1628' }}>
        <AnimatedGridBackground />
        <div className="relative z-10 h-full">
          <LoginScreen />
        </div>
      </div>
    );
  }

  const showNav = mainScreens.includes(currentScreen);

  return (
    <div className="h-[100dvh] w-screen overflow-hidden relative" style={{ background: '#0A1628' }}>
      <AnimatedGridBackground />
      <div className="relative z-10 h-full flex flex-col" style={{ paddingBottom: showNav ? '70px' : '0' }}>
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
          <ScreenRouter />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <TRPCProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </TRPCProvider>
  );
}

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { IncomeManager } from '@/components/dashboard/IncomeManager';
import { ExpenseFilters } from '@/components/filters/ExpenseFilters';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { DailyExpenseChart } from '@/components/charts/DailyExpenseChart';
import { PaymentMethodChart } from '@/components/charts/PaymentMethodChart';
import { BudgetManager } from '@/components/budget/BudgetManager';
import { RecurringManager } from '@/components/recurring/RecurringManager';
import { DataManager } from '@/components/data/DataManager';
import { ExpenseHistory } from '@/components/history/ExpenseHistory';
import { ExpenseChatbot } from '@/components/chat/ExpenseChatbot';
import { MonthlyOverview } from '@/components/monthly/MonthlyOverview';
import { useExpenses } from '@/context/ExpenseContext';
import { Loader2 } from 'lucide-react';

function DashboardContent() {
  const { loading } = useExpenses();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
        <p className="text-muted-foreground">Track and manage your expenses</p>
      </div>

      <SummaryCards />

      <ExpenseFilters />

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <CategoryPieChart />
        <DailyExpenseChart />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <PaymentMethodChart />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExpenseList />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <IncomeManager />
          <BudgetManager />
          <RecurringManager />
          <DataManager />
        </div>
      </div>
    </div>
  );
}

function HistoryContent() {
  const { loading } = useExpenses();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <ExpenseHistory />;
}

function MonthlyContent() {
  const { loading } = useExpenses();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <MonthlyOverview />;
}

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'monthly':
        return <MonthlyContent />;
      case 'history':
        return <HistoryContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <>
      <DashboardLayout activeSection={activeSection} onSectionChange={setActiveSection}>
        {renderContent()}
      </DashboardLayout>
      <ExpenseChatbot />
    </>
  );
};

export default Index;

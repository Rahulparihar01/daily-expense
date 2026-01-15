import { useState } from 'react';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { ExpenseFilters } from '@/components/filters/ExpenseFilters';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { DailyExpenseChart } from '@/components/charts/DailyExpenseChart';
import { BudgetManager } from '@/components/budget/BudgetManager';
import { RecurringManager } from '@/components/recurring/RecurringManager';
import { DataManager } from '@/components/data/DataManager';

function DashboardContent() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
        <p className="text-muted-foreground">Track and manage your expenses</p>
      </div>

      <SummaryCards />

      <ExpenseFilters />

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPieChart />
        <DailyExpenseChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExpenseList />
        </div>
        <div className="space-y-6">
          <BudgetManager />
          <RecurringManager />
          <DataManager />
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <ExpenseProvider>
      <DashboardLayout activeSection={activeSection} onSectionChange={setActiveSection}>
        <DashboardContent />
      </DashboardLayout>
    </ExpenseProvider>
  );
};

export default Index;

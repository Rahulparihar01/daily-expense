import { Wallet, CalendarDays, PieChart, AlertTriangle } from 'lucide-react';
import { SummaryCard } from './SummaryCard';
import { useExpenseStats } from '@/hooks/useExpenseStats';
import { useExpenses } from '@/context/ExpenseContext';
import { format, parseISO } from 'date-fns';

export function SummaryCards() {
  const { currentMonth } = useExpenses();
  const stats = useExpenseStats();
  
  const monthLabel = format(parseISO(`${currentMonth}-01`), 'MMMM yyyy');
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Expenses"
        value={stats.totalExpense}
        subtitle={monthLabel}
        icon={Wallet}
        variant="success"
      />
      <SummaryCard
        title="Today's Spending"
        value={stats.todayTotal}
        subtitle={`${stats.todayExpenses.length} transactions`}
        icon={CalendarDays}
        variant="default"
      />
      <SummaryCard
        title="Categories Used"
        value={`${stats.categoryCount} / 8`}
        subtitle={`${stats.expenseCount} total entries`}
        icon={PieChart}
        variant="default"
      />
      <SummaryCard
        title="Budget Alerts"
        value={stats.overBudgetCount + stats.warningBudgetCount}
        subtitle={
          stats.overBudgetCount > 0 
            ? `${stats.overBudgetCount} over budget` 
            : stats.warningBudgetCount > 0 
              ? `${stats.warningBudgetCount} approaching limit`
              : 'All budgets on track'
        }
        icon={AlertTriangle}
        variant={stats.overBudgetCount > 0 ? 'danger' : stats.warningBudgetCount > 0 ? 'warning' : 'success'}
      />
    </div>
  );
}

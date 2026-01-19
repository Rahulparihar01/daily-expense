import { Wallet, CalendarDays, User, Users } from 'lucide-react';
import { SummaryCard } from './SummaryCard';
import { useExpenseStats } from '@/hooks/useExpenseStats';
import { useExpenses } from '@/context/ExpenseContext';
import { format, parseISO } from 'date-fns';
import { OWNER_CONFIG } from '@/types/expense';

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
        title={`${OWNER_CONFIG.husband.icon} Husband`}
        value={stats.husbandTotal}
        subtitle={`${stats.husbandExpenseCount} expenses`}
        icon={User}
        variant="default"
      />
      <SummaryCard
        title={`${OWNER_CONFIG.wife.icon} Wife`}
        value={stats.wifeTotal}
        subtitle={`${stats.wifeExpenseCount} expenses`}
        icon={Users}
        variant="default"
      />
    </div>
  );
}

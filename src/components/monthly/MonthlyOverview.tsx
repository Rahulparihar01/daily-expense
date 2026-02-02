import { OwnerComparisonChart } from '@/components/charts/OwnerComparisonChart';
import { OwnerExpenseList } from './OwnerExpenseList';
import { MonthlyTrend } from './MonthlyTrend';
import { OwnerLimitManager } from './OwnerLimitManager';
import { LimitAlerts } from './LimitAlerts';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency, calculateTotalExpense } from '@/lib/expense-utils';
import { Card, CardContent } from '@/components/ui/card';
import { OWNER_CONFIG } from '@/types/expense';

export function MonthlyOverview() {
  const { expenses, currentMonth } = useExpenses();

  const husbandTotal = calculateTotalExpense(expenses.filter(e => e.owner === 'husband'));
  const wifeTotal = calculateTotalExpense(expenses.filter(e => e.owner === 'wife'));
  const totalExpense = husbandTotal + wifeTotal;

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-1">Monthly Overview</h2>
        <p className="text-muted-foreground">
          Compare expenses between household members for {formatMonth(currentMonth)}
        </p>
      </div>

      {/* Limit Alerts */}
      <LimitAlerts />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div 
                className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${OWNER_CONFIG.husband.color}20` }}
              >
                {OWNER_CONFIG.husband.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{OWNER_CONFIG.husband.label}'s Total</p>
                <p className="text-2xl font-bold" style={{ color: OWNER_CONFIG.husband.color }}>
                  {formatCurrency(husbandTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div 
                className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${OWNER_CONFIG.wife.color}20` }}
              >
                {OWNER_CONFIG.wife.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{OWNER_CONFIG.wife.label}'s Total</p>
                <p className="text-2xl font-bold" style={{ color: OWNER_CONFIG.wife.color }}>
                  {formatCurrency(wifeTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
                💰
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Combined Total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OwnerComparisonChart />
        <MonthlyTrend />
      </div>

      {/* Owner Expense Lists and Limit Manager */}
      <div className="grid gap-6 lg:grid-cols-3">
        <OwnerExpenseList owner="husband" />
        <OwnerExpenseList owner="wife" />
        <OwnerLimitManager />
      </div>
    </div>
  );
}

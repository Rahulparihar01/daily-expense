import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOwnerLimits } from '@/hooks/useOwnerLimits';
import { useExpenses } from '@/context/ExpenseContext';
import { OWNER_CONFIG, ExpenseOwner } from '@/types/expense';
import { formatCurrency, calculateTotalExpense } from '@/lib/expense-utils';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface LimitAlertProps {
  owner: ExpenseOwner;
  spent: number;
  limit: number;
  percentage: number;
}

function LimitAlert({ owner, spent, limit, percentage }: LimitAlertProps) {
  const isOver = percentage >= 100;
  const config = OWNER_CONFIG[owner];

  return (
    <Alert variant={isOver ? 'destructive' : 'default'} className="border-2">
      <div className="flex items-start gap-3">
        {isOver ? (
          <AlertCircle className="h-5 w-5 text-destructive" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        )}
        <div className="flex-1">
          <AlertTitle className="flex items-center gap-2 mb-1">
            <span>{config.icon}</span>
            {config.label} {isOver ? 'Exceeded Limit!' : 'Approaching Limit'}
          </AlertTitle>
          <AlertDescription className="text-sm">
            {isOver ? (
              <>
                Spending of <strong>{formatCurrency(spent)}</strong> has exceeded the limit of{' '}
                <strong>{formatCurrency(limit)}</strong> by{' '}
                <strong className="text-destructive">{formatCurrency(spent - limit)}</strong>
              </>
            ) : (
              <>
                Spending has reached <strong>{percentage.toFixed(1)}%</strong> of the{' '}
                <strong>{formatCurrency(limit)}</strong> limit. Only{' '}
                <strong>{formatCurrency(limit - spent)}</strong> remaining.
              </>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

export function LimitAlerts() {
  const { currentMonth, expenses } = useExpenses();
  const { getLimit, loading } = useOwnerLimits(currentMonth);

  if (loading) return null;

  const husbandTotal = calculateTotalExpense(expenses.filter(e => e.owner === 'husband'));
  const wifeTotal = calculateTotalExpense(expenses.filter(e => e.owner === 'wife'));
  
  const husbandLimit = getLimit('husband');
  const wifeLimit = getLimit('wife');

  const alerts: LimitAlertProps[] = [];

  // Check husband limit
  if (husbandLimit) {
    const percentage = (husbandTotal / husbandLimit) * 100;
    if (percentage >= 80) {
      alerts.push({
        owner: 'husband',
        spent: husbandTotal,
        limit: husbandLimit,
        percentage,
      });
    }
  }

  // Check wife limit
  if (wifeLimit) {
    const percentage = (wifeTotal / wifeLimit) * 100;
    if (percentage >= 80) {
      alerts.push({
        owner: 'wife',
        spent: wifeTotal,
        limit: wifeLimit,
        percentage,
      });
    }
  }

  if (alerts.length === 0) return null;

  // Sort alerts - exceeded first, then by percentage
  alerts.sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <LimitAlert key={alert.owner} {...alert} />
      ))}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency, formatDate, calculateTotalExpense } from '@/lib/expense-utils';
import { CATEGORY_CONFIG, OWNER_CONFIG, ExpenseOwner } from '@/types/expense';

interface OwnerExpenseListProps {
  owner: ExpenseOwner;
}

export function OwnerExpenseList({ owner }: OwnerExpenseListProps) {
  const { expenses } = useExpenses();
  
  const ownerExpenses = expenses
    .filter(e => e.owner === owner)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const total = calculateTotalExpense(ownerExpenses);
  const config = OWNER_CONFIG[owner];

  return (
    <Card className="shadow-soft h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            {config.label}'s Expenses
          </span>
          <Badge 
            variant="secondary" 
            className="font-semibold"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            {formatCurrency(total)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {ownerExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-3xl mb-2">📝</span>
              <p className="text-sm text-muted-foreground">No expenses yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ownerExpenses.map(expense => (
                <div 
                  key={expense.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div 
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-base"
                    style={{ backgroundColor: `${CATEGORY_CONFIG[expense.category].color}20` }}
                  >
                    {CATEGORY_CONFIG[expense.category].icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {CATEGORY_CONFIG[expense.category].label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(expense.date)}
                      {expense.description && ` • ${expense.description}`}
                    </p>
                  </div>
                  
                  <span className="font-semibold text-sm">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-4 pt-3 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total Transactions</span>
            <span className="font-medium">{ownerExpenses.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

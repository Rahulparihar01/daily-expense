import { Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExpenses } from '@/context/ExpenseContext';
import { useFilteredExpenses } from '@/hooks/useExpenseStats';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  groupExpensesByDate, 
  formatDate, 
  formatCurrency,
  calculateTotalExpense 
} from '@/lib/expense-utils';
import { CATEGORY_CONFIG, OWNER_CONFIG } from '@/types/expense';
import { cn } from '@/lib/utils';

export function ExpenseList() {
  const { deleteExpense } = useExpenses();
  const { canModifyExpense } = useUserRole();
  const filteredExpenses = useFilteredExpenses();
  const groupedExpenses = groupExpensesByDate(filteredExpenses);
  const dates = Object.keys(groupedExpenses);

  if (dates.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
          <p className="text-muted-foreground text-sm">
            Add your first expense to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Expenses</span>
          <Badge variant="secondary" className="font-normal">
            {filteredExpenses.length} entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {dates.map(date => {
          const dayExpenses = groupedExpenses[date];
          const dayTotal = calculateTotalExpense(dayExpenses);
          
          return (
            <div key={date} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {formatDate(date)}
                </h4>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(dayTotal)}
                </span>
              </div>
              
              <div className="space-y-2">
                {dayExpenses.map(expense => {
                  const canDelete = canModifyExpense(expense.owner);
                  
                  return (
                    <div 
                      key={expense.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg bg-secondary/30',
                        'transition-all duration-200 hover:bg-secondary/50 group'
                      )}
                    >
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${CATEGORY_CONFIG[expense.category].color}20` }}
                      >
                        {CATEGORY_CONFIG[expense.category].icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {CATEGORY_CONFIG[expense.category].label}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs px-1.5 py-0"
                            style={{ 
                              borderColor: OWNER_CONFIG[expense.owner].color,
                              color: OWNER_CONFIG[expense.owner].color
                            }}
                          >
                            {OWNER_CONFIG[expense.owner].icon} {OWNER_CONFIG[expense.owner].label}
                          </Badge>
                          {expense.isRecurring && (
                            <RefreshCw className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        {expense.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {expense.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {formatCurrency(expense.amount)}
                        </span>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

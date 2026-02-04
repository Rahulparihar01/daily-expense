import { useState } from 'react';
import { Wallet, Edit2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMonthlyIncome } from '@/hooks/useMonthlyIncome';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency, calculateTotalExpense } from '@/lib/expense-utils';
import { format, parseISO } from 'date-fns';

export function IncomeManager() {
  const { currentMonth, expenses } = useExpenses();
  const { income, setMonthlyIncome } = useMonthlyIncome(currentMonth);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const totalExpense = calculateTotalExpense(expenses);
  const incomeAmount = income?.amount || 0;
  const remainingAmount = incomeAmount - totalExpense;
  const spentPercentage = incomeAmount > 0 ? (totalExpense / incomeAmount) * 100 : 0;

  const handleEdit = () => {
    setInputValue(incomeAmount.toString());
    setIsEditing(true);
  };

  const handleSave = () => {
    const amount = parseFloat(inputValue);
    if (!isNaN(amount) && amount >= 0) {
      setMonthlyIncome(amount);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue('');
  };

  const monthLabel = format(parseISO(`${currentMonth}-01`), 'MMMM yyyy');

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Monthly Income
          </div>
          {!isEditing && (
            <Button variant="ghost" size="icon" onClick={handleEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">{monthLabel}</p>
        
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter income"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1"
              min="0"
            />
            <Button size="icon" variant="outline" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Income</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(incomeAmount)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Spent</span>
              <span className="text-lg font-semibold text-destructive">
                {formatCurrency(totalExpense)}
              </span>
            </div>
            
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  spentPercentage >= 100 ? 'bg-destructive' : 
                  spentPercentage >= 80 ? 'bg-yellow-500' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Remaining</span>
              <span className={`text-xl font-bold ${
                remainingAmount >= 0 ? 'text-green-600' : 'text-destructive'
              }`}>
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

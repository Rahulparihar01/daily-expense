import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOwnerLimits } from '@/hooks/useOwnerLimits';
import { useExpenses } from '@/context/ExpenseContext';
import { OWNER_CONFIG, ExpenseOwner } from '@/types/expense';
import { formatCurrency, calculateTotalExpense } from '@/lib/expense-utils';
import { Settings, Trash2 } from 'lucide-react';

export function OwnerLimitManager() {
  const { currentMonth, expenses } = useExpenses();
  const { limits, setLimit, removeLimit, getLimit } = useOwnerLimits(currentMonth);
  const [husbandLimit, setHusbandLimit] = useState('');
  const [wifeLimit, setWifeLimit] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const husbandTotal = calculateTotalExpense(expenses.filter(e => e.owner === 'husband'));
  const wifeTotal = calculateTotalExpense(expenses.filter(e => e.owner === 'wife'));

  const handleSetLimit = async (owner: ExpenseOwner) => {
    const value = owner === 'husband' ? husbandLimit : wifeLimit;
    const amount = parseFloat(value);
    
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    await setLimit(owner, amount);
    if (owner === 'husband') setHusbandLimit('');
    else setWifeLimit('');
    setIsEditing(false);
  };

  const handleRemoveLimit = async (owner: ExpenseOwner) => {
    await removeLimit(owner);
  };

  const renderLimitStatus = (owner: ExpenseOwner, spent: number) => {
    const limit = getLimit(owner);
    if (!limit) return null;

    const percentage = (spent / limit) * 100;
    const config = OWNER_CONFIG[owner];

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Limit: {formatCurrency(limit)}</span>
          <span className={percentage >= 80 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: percentage >= 100 
                ? 'hsl(var(--destructive))' 
                : percentage >= 80 
                  ? 'hsl(45, 93%, 47%)' 
                  : config.color,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Spent: {formatCurrency(spent)}</span>
          <span>Remaining: {formatCurrency(Math.max(limit - spent, 0))}</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Spending Limits
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Done' : 'Edit'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Husband Limit */}
        <div className="space-y-3 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-xl">{OWNER_CONFIG.husband.icon}</span>
            <span className="font-medium">{OWNER_CONFIG.husband.label}</span>
          </div>
          
          {renderLimitStatus('husband', husbandTotal)}

          {isEditing && (
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder={getLimit('husband')?.toString() || 'Set limit...'}
                  value={husbandLimit}
                  onChange={(e) => setHusbandLimit(e.target.value)}
                  min="0"
                  step="100"
                />
              </div>
              <Button size="sm" onClick={() => handleSetLimit('husband')}>
                Set
              </Button>
              {getLimit('husband') && (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleRemoveLimit('husband')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {!getLimit('husband') && !isEditing && (
            <p className="text-sm text-muted-foreground">No limit set</p>
          )}
        </div>

        {/* Wife Limit */}
        <div className="space-y-3 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-xl">{OWNER_CONFIG.wife.icon}</span>
            <span className="font-medium">{OWNER_CONFIG.wife.label}</span>
          </div>
          
          {renderLimitStatus('wife', wifeTotal)}

          {isEditing && (
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder={getLimit('wife')?.toString() || 'Set limit...'}
                  value={wifeLimit}
                  onChange={(e) => setWifeLimit(e.target.value)}
                  min="0"
                  step="100"
                />
              </div>
              <Button size="sm" onClick={() => handleSetLimit('wife')}>
                Set
              </Button>
              {getLimit('wife') && (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleRemoveLimit('wife')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {!getLimit('wife') && !isEditing && (
            <p className="text-sm text-muted-foreground">No limit set</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

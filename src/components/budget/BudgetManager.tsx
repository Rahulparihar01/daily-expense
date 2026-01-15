import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Target, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useExpenses } from '@/context/ExpenseContext';
import { useExpenseStats } from '@/hooks/useExpenseStats';
import { ALL_CATEGORIES, CATEGORY_CONFIG, ExpenseCategory } from '@/types/expense';
import { formatCurrency } from '@/lib/expense-utils';
import { cn } from '@/lib/utils';

const budgetSchema = z.object({
  category: z.enum(['milk', 'food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other']),
  limit: z.string().min(1, 'Limit is required').transform(val => parseFloat(val)),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export function BudgetManager() {
  const [open, setOpen] = useState(false);
  const { budgets, setBudget, removeBudget } = useExpenses();
  const { budgetAnalysis } = useExpenseStats();

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: 'food',
      limit: '' as any,
    },
  });

  const categoriesWithBudget = budgets.map(b => b.category);
  const availableCategories = ALL_CATEGORIES.filter(c => !categoriesWithBudget.includes(c));

  function onSubmit(data: BudgetFormData) {
    setBudget(data.category, data.limit);
    form.reset();
    setOpen(false);
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Budget Limits
        </CardTitle>
        {availableCategories.length > 0 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Set Category Budget</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>
                                <span className="flex items-center gap-2">
                                  <span>{CATEGORY_CONFIG[cat].icon}</span>
                                  <span>{CATEGORY_CONFIG[cat].label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Limit (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            min="0"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Set Budget
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {budgetAnalysis.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No budgets set. Click "Add" to create one.
          </div>
        ) : (
          budgetAnalysis.map(budget => (
            <div key={budget.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CATEGORY_CONFIG[budget.category].icon}</span>
                  <span className="font-medium">{CATEGORY_CONFIG[budget.category].label}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeBudget(budget.category)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              <div className="space-y-1">
                <Progress 
                  value={budget.percentage} 
                  className={cn(
                    'h-2',
                    budget.status === 'danger' && '[&>div]:bg-destructive',
                    budget.status === 'warning' && '[&>div]:bg-warning'
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {formatCurrency(budget.spent)} spent
                  </span>
                  <span className={cn(
                    budget.status === 'danger' && 'text-destructive font-medium',
                    budget.status === 'warning' && 'text-warning font-medium'
                  )}>
                    {budget.remaining >= 0 
                      ? `${formatCurrency(budget.remaining)} left`
                      : `${formatCurrency(Math.abs(budget.remaining))} over`
                    }
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useExpenses } from '@/context/ExpenseContext';
import { ALL_CATEGORIES, CATEGORY_CONFIG } from '@/types/expense';
import { getTodayString } from '@/lib/expense-utils';
import { useToast } from '@/hooks/use-toast';

const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  category: z.enum(['milk', 'food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other']),
  amount: z.string().min(1, 'Amount is required').transform(val => parseFloat(val)),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly']).nullable().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  trigger?: React.ReactNode;
}

export function ExpenseForm({ trigger }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const { addExpense, addRecurringTemplate } = useExpenses();
  const { toast } = useToast();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: getTodayString(),
      category: 'food',
      amount: '' as any,
      description: '',
      isRecurring: false,
      recurringFrequency: null,
    },
  });

  const isRecurring = form.watch('isRecurring');

  function onSubmit(data: ExpenseFormData) {
    if (data.isRecurring && data.recurringFrequency) {
      // Create recurring template
      addRecurringTemplate({
        category: data.category,
        amount: data.amount,
        description: data.description,
        frequency: data.recurringFrequency,
        startDate: data.date,
        isActive: true,
      });
      
      toast({
        title: 'Recurring expense created',
        description: `${CATEGORY_CONFIG[data.category].icon} ${CATEGORY_CONFIG[data.category].label} - ${data.recurringFrequency}`,
      });
    } else {
      // Create single expense
      addExpense({
        date: data.date,
        category: data.category,
        amount: data.amount,
        description: data.description,
        isRecurring: false,
        recurringFrequency: null,
      });
      
      toast({
        title: 'Expense added',
        description: `${CATEGORY_CONFIG[data.category].icon} ₹${data.amount} added to ${CATEGORY_CONFIG[data.category].label}`,
      });
    }

    form.reset({
      date: getTodayString(),
      category: 'food',
      amount: '' as any,
      description: '',
      isRecurring: false,
      recurringFrequency: null,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 shadow-soft">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            Add New Expense
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        step="0.01"
                        min="0"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      {ALL_CATEGORIES.map(cat => (
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a note..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Make this recurring
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isRecurring && (
                <FormField
                  control={form.control}
                  name="recurringFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button type="submit" className="w-full">
              Add Expense
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

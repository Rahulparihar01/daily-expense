import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Expense, CategoryBudget, RecurringTemplate, ExpenseCategory, ExpenseOwner } from '@/types/expense';
import { useToast } from '@/hooks/use-toast';

export function useExpenseDatabase(currentMonth: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch expenses for the current month
  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    
    const startDate = `${currentMonth}-01`;
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    // Last day of month — compute without timezone conversion
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching expenses:', error);
      return;
    }

    setExpenses(data.map(e => ({
      id: e.id,
      date: e.date,
      category: e.category as ExpenseCategory,
      owner: e.owner as ExpenseOwner,
      amount: parseFloat(e.amount.toString()),
      description: e.description || undefined,
      paymentMethod: (e as any).payment_method || 'cash',
      isRecurring: e.is_recurring,
      recurringFrequency: e.recurring_frequency as Expense['recurringFrequency'],
      recurringTemplateId: e.recurring_template_id || undefined,
      createdAt: e.created_at,
    })));
  }, [user, currentMonth]);

  // Fetch budgets for current month
  const fetchBudgets = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', currentMonth);

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching budgets:', error);
      return;
    }

    setBudgets(data.map(b => ({
      category: b.category as ExpenseCategory,
      limit: parseFloat(b.budget_limit.toString()),
    })));
  }, [user, currentMonth]);

  // Fetch recurring templates
  const fetchRecurringTemplates = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching recurring templates:', error);
      return;
    }

    setRecurringTemplates(data.map(t => ({
      id: t.id,
      category: t.category as ExpenseCategory,
      owner: t.owner as ExpenseOwner,
      amount: parseFloat(t.amount.toString()),
      description: t.description || undefined,
      frequency: t.frequency as RecurringTemplate['frequency'],
      startDate: t.start_date,
      lastGenerated: t.last_generated || undefined,
      isActive: t.is_active,
    })));
  }, [user]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchExpenses(),
      fetchBudgets(),
      fetchRecurringTemplates(),
    ]);
    setLoading(false);
  }, [fetchExpenses, fetchBudgets, fetchRecurringTemplates]);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, currentMonth, refreshData]);

  // Add expense
  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      date: expenseData.date,
      category: expenseData.category,
      owner: expenseData.owner,
      amount: expenseData.amount,
      description: expenseData.description || null,
      payment_method: expenseData.paymentMethod || 'cash',
      is_recurring: expenseData.isRecurring,
      recurring_frequency: expenseData.recurringFrequency,
      recurring_template_id: expenseData.recurringTemplateId || null,
    } as any);

    if (error) {
      toast({ title: 'Error adding expense', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchExpenses();
  }, [user, fetchExpenses, toast]);

  // Update expense
  const updateExpense = useCallback(async (expense: Expense) => {
    if (!user) return;

    const { error } = await supabase
      .from('expenses')
      .update({
        date: expense.date,
        category: expense.category,
        owner: expense.owner,
        amount: expense.amount,
        description: expense.description || null,
        is_recurring: expense.isRecurring,
        recurring_frequency: expense.recurringFrequency,
      })
      .eq('id', expense.id);

    if (error) {
      toast({ title: 'Error updating expense', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchExpenses();
  }, [user, fetchExpenses, toast]);

  // Delete expense
  const deleteExpense = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error deleting expense', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchExpenses();
  }, [user, fetchExpenses, toast]);

  // Set budget
  const setBudget = useCallback(async (category: ExpenseCategory, limit: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('budgets')
      .upsert({
        user_id: user.id,
        category,
        month: currentMonth,
        budget_limit: limit,
      }, {
        onConflict: 'user_id,category,month',
      });

    if (error) {
      toast({ title: 'Error setting budget', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchBudgets();
  }, [user, currentMonth, fetchBudgets, toast]);

  // Remove budget
  const removeBudget = useCallback(async (category: ExpenseCategory) => {
    if (!user) return;

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('category', category)
      .eq('month', currentMonth);

    if (error) {
      toast({ title: 'Error removing budget', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchBudgets();
  }, [user, currentMonth, fetchBudgets, toast]);

  // Add recurring template
  const addRecurringTemplate = useCallback(async (templateData: Omit<RecurringTemplate, 'id'>) => {
    if (!user) return;

    const { error } = await supabase.from('recurring_templates').insert({
      user_id: user.id,
      category: templateData.category,
      owner: templateData.owner,
      amount: templateData.amount,
      description: templateData.description || null,
      frequency: templateData.frequency,
      start_date: templateData.startDate,
      is_active: templateData.isActive,
    });

    if (error) {
      toast({ title: 'Error adding recurring expense', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchRecurringTemplates();
  }, [user, fetchRecurringTemplates, toast]);

  // Update recurring template
  const updateRecurringTemplate = useCallback(async (template: RecurringTemplate) => {
    if (!user) return;

    const { error } = await supabase
      .from('recurring_templates')
      .update({
        category: template.category,
        owner: template.owner,
        amount: template.amount,
        description: template.description || null,
        frequency: template.frequency,
        is_active: template.isActive,
        last_generated: template.lastGenerated || null,
      })
      .eq('id', template.id);

    if (error) {
      toast({ title: 'Error updating recurring expense', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchRecurringTemplates();
  }, [user, fetchRecurringTemplates, toast]);

  // Delete recurring template
  const deleteRecurringTemplate = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase.from('recurring_templates').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error deleting recurring expense', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchRecurringTemplates();
  }, [user, fetchRecurringTemplates, toast]);

  return {
    expenses,
    budgets,
    recurringTemplates,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    setBudget,
    removeBudget,
    addRecurringTemplate,
    updateRecurringTemplate,
    deleteRecurringTemplate,
    refreshData,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MonthlyIncome {
  id: string;
  month: string;
  amount: number;
}

export function useMonthlyIncome(currentMonth: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [income, setIncome] = useState<MonthlyIncome | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIncome = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('monthly_income' as any)
      .select('*')
      .eq('month', currentMonth)
      .maybeSingle();

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching income:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setIncome({
        id: (data as any).id,
        month: (data as any).month,
        amount: parseFloat((data as any).amount?.toString() || '0'),
      });
    } else {
      setIncome(null);
    }
    setLoading(false);
  }, [user, currentMonth]);

  useEffect(() => {
    if (user) {
      fetchIncome();
    }
  }, [user, currentMonth, fetchIncome]);

  const setMonthlyIncome = useCallback(async (amount: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('monthly_income' as any)
      .upsert({
        user_id: user.id,
        month: currentMonth,
        amount,
      } as any, {
        onConflict: 'user_id,month',
      });

    if (error) {
      toast({ title: 'Error setting income', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Income updated', description: `Monthly income set to ₹${amount}` });
    await fetchIncome();
  }, [user, currentMonth, fetchIncome, toast]);

  return {
    income,
    loading,
    setMonthlyIncome,
    refreshIncome: fetchIncome,
  };
}

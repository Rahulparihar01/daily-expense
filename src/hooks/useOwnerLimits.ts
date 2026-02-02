import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ExpenseOwner } from '@/types/expense';

export interface OwnerLimit {
  id: string;
  owner: ExpenseOwner;
  month: string;
  limitAmount: number;
}

export function useOwnerLimits(month: string) {
  const { user } = useAuth();
  const [limits, setLimits] = useState<OwnerLimit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLimits = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase
        .from('owner_limits' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)) as any;

      if (error) throw error;

      setLimits(
        (data || []).map((item: any) => ({
          id: item.id,
          owner: item.owner as ExpenseOwner,
          month: item.month,
          limitAmount: Number(item.limit_amount),
        }))
      );
    } catch (error) {
      console.error('Error fetching owner limits:', error);
    } finally {
      setLoading(false);
    }
  }, [user, month]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  const setLimit = async (owner: ExpenseOwner, limitAmount: number) => {
    if (!user) return;

    try {
      const existingLimit = limits.find(l => l.owner === owner);

      if (existingLimit) {
        const { error } = await (supabase
          .from('owner_limits' as any)
          .update({ limit_amount: limitAmount, updated_at: new Date().toISOString() })
          .eq('id', existingLimit.id)) as any;

        if (error) throw error;
        toast.success(`${owner === 'husband' ? 'Husband' : 'Wife'}'s limit updated`);
      } else {
        const { error } = await (supabase
          .from('owner_limits' as any)
          .insert({
            user_id: user.id,
            owner,
            month,
            limit_amount: limitAmount,
          })) as any;

        if (error) throw error;
        toast.success(`${owner === 'husband' ? 'Husband' : 'Wife'}'s limit set`);
      }

      fetchLimits();
    } catch (error) {
      console.error('Error setting owner limit:', error);
      toast.error('Failed to set limit');
    }
  };

  const removeLimit = async (owner: ExpenseOwner) => {
    if (!user) return;

    try {
      const existingLimit = limits.find(l => l.owner === owner);
      if (!existingLimit) return;

      const { error } = await (supabase
        .from('owner_limits' as any)
        .delete()
        .eq('id', existingLimit.id)) as any;

      if (error) throw error;
      toast.success(`${owner === 'husband' ? 'Husband' : 'Wife'}'s limit removed`);
      fetchLimits();
    } catch (error) {
      console.error('Error removing owner limit:', error);
      toast.error('Failed to remove limit');
    }
  };

  const getLimit = (owner: ExpenseOwner): number | null => {
    const limit = limits.find(l => l.owner === owner);
    return limit ? limit.limitAmount : null;
  };

  return {
    limits,
    loading,
    setLimit,
    removeLimit,
    getLimit,
    refreshLimits: fetchLimits,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { ExpenseOwner } from '@/types/expense';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<ExpenseOwner | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching role:', error);
      setRole(null);
    } else {
      // Type assertion needed as database types may not be updated yet
      const profileData = data as { role?: string } | null;
      setRole(profileData?.role as ExpenseOwner || null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Check if the current user can edit/delete an expense based on owner
  const canModifyExpense = useCallback((expenseOwner: ExpenseOwner): boolean => {
    if (!role) return false;
    return role === expenseOwner;
  }, [role]);

  return { role, loading, canModifyExpense, refetch: fetchRole };
}

import { supabase } from '@/integrations/supabase/client';
import { OWNER_CONFIG, CATEGORY_CONFIG, ExpenseOwner, ExpenseCategory } from '@/types/expense';

export type NotificationType = 'expense_added' | 'limit_warning' | 'limit_reached';

interface NotificationPayload {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(payload: NotificationPayload) {
  try {
    const { error } = await supabase
      .from('notifications' as 'expenses')
      .insert(payload as never);

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export function formatExpenseAddedNotification(
  userId: string,
  amount: number,
  category: ExpenseCategory,
  owner: ExpenseOwner,
  description?: string
): NotificationPayload {
  const ownerLabel = OWNER_CONFIG[owner]?.label || owner;
  const categoryLabel = CATEGORY_CONFIG[category]?.label || category;
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

  return {
    user_id: userId,
    type: 'expense_added',
    title: `New Expense Added`,
    message: `${ownerLabel} added ${formattedAmount} for ${categoryLabel}${description ? ` - ${description}` : ''}`,
    metadata: { amount, category, owner, description },
  };
}

export function formatLimitWarningNotification(
  userId: string,
  owner: ExpenseOwner,
  spent: number,
  limit: number
): NotificationPayload {
  const ownerLabel = OWNER_CONFIG[owner]?.label || owner;
  const percentage = Math.round((spent / limit) * 100);
  const formattedSpent = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(spent);
  const formattedLimit = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(limit);

  return {
    user_id: userId,
    type: 'limit_warning',
    title: `⚠️ Spending Alert - ${ownerLabel}`,
    message: `${ownerLabel} has reached ${percentage}% of the monthly limit (${formattedSpent} of ${formattedLimit})`,
    metadata: { owner, spent, limit, percentage },
  };
}

export function formatLimitReachedNotification(
  userId: string,
  owner: ExpenseOwner,
  spent: number,
  limit: number
): NotificationPayload {
  const ownerLabel = OWNER_CONFIG[owner]?.label || owner;
  const formattedSpent = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(spent);
  const formattedLimit = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(limit);

  return {
    user_id: userId,
    type: 'limit_reached',
    title: `🚨 Limit Reached - ${ownerLabel}`,
    message: `${ownerLabel} has exceeded the monthly limit! Spent ${formattedSpent} (limit: ${formattedLimit})`,
    metadata: { owner, spent, limit },
  };
}

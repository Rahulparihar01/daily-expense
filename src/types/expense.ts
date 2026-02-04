export type ExpenseCategory = 
  | 'milk'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'entertainment'
  | 'healthcare'
  | 'shopping'
  | 'other';

export type ExpenseOwner = 'husband' | 'wife';

export type PaymentMethod = 'cash' | 'card' | 'online';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | null;

export interface Expense {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  description?: string;
  owner: ExpenseOwner;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency;
  recurringTemplateId?: string;
  createdAt: string;
}

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: string; color: string }> = {
  cash: { label: 'Cash', icon: '💵', color: 'hsl(140, 60%, 45%)' },
  card: { label: 'Card', icon: '💳', color: 'hsl(210, 70%, 50%)' },
  online: { label: 'Online', icon: '📱', color: 'hsl(280, 60%, 55%)' },
};

export const ALL_PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'online'];

export const OWNER_CONFIG: Record<ExpenseOwner, { label: string; icon: string; color: string }> = {
  husband: { label: 'Husband', icon: '👨', color: 'hsl(210, 70%, 50%)' },
  wife: { label: 'Wife', icon: '👩', color: 'hsl(330, 70%, 55%)' },
};

export const ALL_OWNERS: ExpenseOwner[] = ['husband', 'wife'];

export interface RecurringTemplate {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  owner: ExpenseOwner;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  lastGenerated?: string;
  isActive: boolean;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  limit: number;
}

export interface MonthData {
  month: string; // YYYY-MM format
  expenses: Expense[];
  budgets: CategoryBudget[];
  recurringTemplates: RecurringTemplate[];
}

export interface DateFilter {
  type: 'single' | 'range' | 'all';
  startDate?: string;
  endDate?: string;
}

export interface ExpenseFilters {
  dateFilter: DateFilter;
  categories: ExpenseCategory[];
}

export const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; color: string; icon: string }> = {
  milk: { label: 'Milk', color: 'hsl(200, 70%, 50%)', icon: '🥛' },
  food: { label: 'Food', color: 'hsl(30, 80%, 55%)', icon: '🍔' },
  transport: { label: 'Transport', color: 'hsl(260, 60%, 55%)', icon: '🚗' },
  utilities: { label: 'Utilities', color: 'hsl(45, 85%, 50%)', icon: '💡' },
  entertainment: { label: 'Entertainment', color: 'hsl(320, 65%, 55%)', icon: '🎬' },
  healthcare: { label: 'Healthcare', color: 'hsl(0, 70%, 55%)', icon: '🏥' },
  shopping: { label: 'Shopping', color: 'hsl(280, 60%, 55%)', icon: '🛍️' },
  other: { label: 'Other', color: 'hsl(150, 50%, 45%)', icon: '📦' },
};

export const ALL_CATEGORIES: ExpenseCategory[] = [
  'milk', 'food', 'transport', 'utilities', 
  'entertainment', 'healthcare', 'shopping', 'other'
];

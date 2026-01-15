export type ExpenseCategory = 
  | 'milk'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'entertainment'
  | 'healthcare'
  | 'shopping'
  | 'other';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | null;

export interface Expense {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  description?: string;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency;
  recurringTemplateId?: string;
  createdAt: string;
}

export interface RecurringTemplate {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
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

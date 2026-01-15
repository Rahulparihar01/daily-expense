import { MonthData, Expense, CategoryBudget, RecurringTemplate } from '@/types/expense';

const STORAGE_PREFIX = 'expense-tracker-';

export function getMonthKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getStorageKey(monthKey: string): string {
  return `${STORAGE_PREFIX}${monthKey}`;
}

export function getMonthData(monthKey: string): MonthData {
  const key = getStorageKey(monthKey);
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      console.error('Failed to parse stored data for', monthKey);
    }
  }
  
  return {
    month: monthKey,
    expenses: [],
    budgets: [],
    recurringTemplates: [],
  };
}

export function saveMonthData(data: MonthData): void {
  const key = getStorageKey(data.month);
  localStorage.setItem(key, JSON.stringify(data));
}

export function addExpense(expense: Expense): void {
  const monthKey = getMonthKey(expense.date);
  const data = getMonthData(monthKey);
  data.expenses.push(expense);
  saveMonthData(data);
}

export function updateExpense(expense: Expense): void {
  const monthKey = getMonthKey(expense.date);
  const data = getMonthData(monthKey);
  const index = data.expenses.findIndex(e => e.id === expense.id);
  if (index !== -1) {
    data.expenses[index] = expense;
    saveMonthData(data);
  }
}

export function deleteExpense(expenseId: string, date: string): void {
  const monthKey = getMonthKey(date);
  const data = getMonthData(monthKey);
  data.expenses = data.expenses.filter(e => e.id !== expenseId);
  saveMonthData(data);
}

export function updateBudgets(monthKey: string, budgets: CategoryBudget[]): void {
  const data = getMonthData(monthKey);
  data.budgets = budgets;
  saveMonthData(data);
}

export function updateRecurringTemplates(monthKey: string, templates: RecurringTemplate[]): void {
  const data = getMonthData(monthKey);
  data.recurringTemplates = templates;
  saveMonthData(data);
}

export function getAllMonthKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key.replace(STORAGE_PREFIX, ''));
    }
  }
  return keys.sort().reverse();
}

export function exportMonthData(monthKey: string): string {
  const data = getMonthData(monthKey);
  return JSON.stringify(data, null, 2);
}

export function exportAllData(): string {
  const allMonths = getAllMonthKeys();
  const allData = allMonths.map(month => getMonthData(month));
  return JSON.stringify(allData, null, 2);
}

export function importMonthData(jsonString: string): MonthData | null {
  try {
    const data = JSON.parse(jsonString) as MonthData;
    if (data.month && Array.isArray(data.expenses)) {
      saveMonthData(data);
      return data;
    }
    return null;
  } catch {
    console.error('Failed to import data');
    return null;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

import { format, parseISO, isWithinInterval, startOfDay, endOfDay, addDays, addWeeks, addMonths, isBefore, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { Expense, ExpenseFilters, ExpenseCategory, RecurringTemplate, CATEGORY_CONFIG, CategoryBudget } from '@/types/expense';
import { generateId } from './storage';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM dd, yyyy');
}

export function formatDateShort(dateString: string): string {
  return format(parseISO(dateString), 'dd MMM');
}

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  return expenses.filter(expense => {
    // Date filter
    if (filters.dateFilter.type === 'single' && filters.dateFilter.startDate) {
      if (expense.date !== filters.dateFilter.startDate) {
        return false;
      }
    } else if (filters.dateFilter.type === 'range' && filters.dateFilter.startDate && filters.dateFilter.endDate) {
      const expenseDate = parseISO(expense.date);
      const start = startOfDay(parseISO(filters.dateFilter.startDate));
      const end = endOfDay(parseISO(filters.dateFilter.endDate));
      if (!isWithinInterval(expenseDate, { start, end })) {
        return false;
      }
    }

    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(expense.category)) {
      return false;
    }

    return true;
  });
}

export function groupExpensesByDate(expenses: Expense[]): Record<string, Expense[]> {
  const sorted = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sorted.reduce((acc, expense) => {
    if (!acc[expense.date]) {
      acc[expense.date] = [];
    }
    acc[expense.date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);
}

export function calculateCategoryTotals(expenses: Expense[]): Record<ExpenseCategory, number> {
  return expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<ExpenseCategory, number>);
}

export function calculateDailyTotals(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    acc[expense.date] = (acc[expense.date] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
}

export function calculateTotalExpense(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function getTodayExpenses(expenses: Expense[]): Expense[] {
  const today = getTodayString();
  return expenses.filter(e => e.date === today);
}

export function getCategoryLabel(category: ExpenseCategory): string {
  return CATEGORY_CONFIG[category].label;
}

export function getCategoryColor(category: ExpenseCategory): string {
  return CATEGORY_CONFIG[category].color;
}

export function getCategoryIcon(category: ExpenseCategory): string {
  return CATEGORY_CONFIG[category].icon;
}

export function getBudgetStatus(spent: number, limit: number): 'safe' | 'warning' | 'danger' {
  const percentage = (spent / limit) * 100;
  if (percentage >= 100) return 'danger';
  if (percentage >= 75) return 'warning';
  return 'safe';
}

export function getBudgetPercentage(spent: number, limit: number): number {
  return Math.min((spent / limit) * 100, 100);
}

export function generateRecurringExpenses(
  templates: RecurringTemplate[],
  monthKey: string,
  existingExpenses: Expense[]
): Expense[] {
  const newExpenses: Expense[] = [];
  const monthStart = startOfMonth(parseISO(`${monthKey}-01`));
  const monthEnd = endOfMonth(monthStart);
  const today = new Date();

  templates.forEach(template => {
    if (!template.isActive) return;

    let currentDate = parseISO(template.startDate);
    
    // Skip dates before month start
    while (isBefore(currentDate, monthStart)) {
      currentDate = getNextRecurringDate(currentDate, template.frequency);
    }

    // Generate expenses for the month
    while (isBefore(currentDate, monthEnd) && !isAfter(currentDate, today)) {
      const dateString = format(currentDate, 'yyyy-MM-dd');
      
      // Check if expense already exists for this template and date
      const exists = existingExpenses.some(
        e => e.recurringTemplateId === template.id && e.date === dateString
      );

      if (!exists) {
        newExpenses.push({
          id: generateId(),
          date: dateString,
          category: template.category,
          amount: template.amount,
          description: template.description,
          owner: template.owner,
          isRecurring: true,
          recurringFrequency: template.frequency,
          recurringTemplateId: template.id,
          createdAt: new Date().toISOString(),
        });
      }

      currentDate = getNextRecurringDate(currentDate, template.frequency);
    }
  });

  return newExpenses;
}

function getNextRecurringDate(date: Date, frequency: 'daily' | 'weekly' | 'monthly'): Date {
  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
  }
}

export function getChartData(expenses: Expense[]) {
  const categoryTotals = calculateCategoryTotals(expenses);
  const dailyTotals = calculateDailyTotals(expenses);

  const pieData = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_CONFIG[category as ExpenseCategory].label,
      value,
      color: CATEGORY_CONFIG[category as ExpenseCategory].color,
    }));

  const sortedDates = Object.keys(dailyTotals).sort();
  const barData = sortedDates.map(date => ({
    date: formatDateShort(date),
    fullDate: date,
    amount: dailyTotals[date],
  }));

  return { pieData, barData };
}

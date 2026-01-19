import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Expense, 
  ExpenseFilters, 
  CategoryBudget, 
  RecurringTemplate,
  ExpenseCategory,
  MonthData
} from '@/types/expense';
import { getMonthKey } from '@/lib/storage';
import { useExpenseDatabase } from '@/hooks/useExpenseDatabase';

interface ExpenseContextType {
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  monthData: MonthData;
  expenses: Expense[];
  budgets: CategoryBudget[];
  recurringTemplates: RecurringTemplate[];
  filters: ExpenseFilters;
  setFilters: (filters: ExpenseFilters) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  setBudget: (category: ExpenseCategory, limit: number) => void;
  removeBudget: (category: ExpenseCategory) => void;
  addRecurringTemplate: (template: Omit<RecurringTemplate, 'id'>) => void;
  updateRecurringTemplate: (template: RecurringTemplate) => void;
  deleteRecurringTemplate: (id: string) => void;
  refreshData: () => void;
  availableMonths: string[];
  loading: boolean;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [currentMonth, setCurrentMonth] = useState(() => getMonthKey(new Date()));
  const [filters, setFilters] = useState<ExpenseFilters>({
    dateFilter: { type: 'all' },
    categories: [],
  });

  const {
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
  } = useExpenseDatabase(currentMonth);

  // Generate available months from expenses (unique months)
  const availableMonths = [...new Set(expenses.map(e => getMonthKey(e.date)))].sort().reverse();
  if (!availableMonths.includes(currentMonth)) {
    availableMonths.unshift(currentMonth);
  }

  const monthData: MonthData = {
    month: currentMonth,
    expenses,
    budgets,
    recurringTemplates,
  };

  return (
    <ExpenseContext.Provider
      value={{
        currentMonth,
        setCurrentMonth,
        monthData,
        expenses,
        budgets,
        recurringTemplates,
        filters,
        setFilters,
        addExpense,
        updateExpense,
        deleteExpense,
        setBudget,
        removeBudget,
        addRecurringTemplate,
        updateRecurringTemplate,
        deleteRecurringTemplate,
        refreshData,
        availableMonths,
        loading,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}

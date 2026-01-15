import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  Expense, 
  MonthData, 
  ExpenseFilters, 
  CategoryBudget, 
  RecurringTemplate,
  ExpenseCategory 
} from '@/types/expense';
import { 
  getMonthData, 
  saveMonthData, 
  getMonthKey, 
  generateId,
  getAllMonthKeys 
} from '@/lib/storage';
import { generateRecurringExpenses } from '@/lib/expense-utils';

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
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [currentMonth, setCurrentMonth] = useState(() => getMonthKey(new Date()));
  const [monthData, setMonthData] = useState<MonthData>(() => getMonthData(currentMonth));
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>({
    dateFilter: { type: 'all' },
    categories: [],
  });

  const refreshData = useCallback(() => {
    const data = getMonthData(currentMonth);
    
    // Generate recurring expenses
    const newRecurring = generateRecurringExpenses(
      data.recurringTemplates,
      currentMonth,
      data.expenses
    );
    
    if (newRecurring.length > 0) {
      data.expenses = [...data.expenses, ...newRecurring];
      saveMonthData(data);
    }
    
    setMonthData(data);
    setAvailableMonths(getAllMonthKeys());
  }, [currentMonth]);

  useEffect(() => {
    refreshData();
  }, [currentMonth, refreshData]);

  useEffect(() => {
    // Initialize current month if it doesn't exist
    const data = getMonthData(currentMonth);
    if (!data.expenses.length && !data.budgets.length && !data.recurringTemplates.length) {
      saveMonthData(data);
    }
    setAvailableMonths(getAllMonthKeys());
  }, []);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const expense: Expense = {
      ...expenseData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    const expenseMonth = getMonthKey(expense.date);
    const data = getMonthData(expenseMonth);
    data.expenses.push(expense);
    saveMonthData(data);
    
    if (expenseMonth === currentMonth) {
      refreshData();
    }
  }, [currentMonth, refreshData]);

  const updateExpense = useCallback((expense: Expense) => {
    const expenseMonth = getMonthKey(expense.date);
    const data = getMonthData(expenseMonth);
    const index = data.expenses.findIndex(e => e.id === expense.id);
    if (index !== -1) {
      data.expenses[index] = expense;
      saveMonthData(data);
      if (expenseMonth === currentMonth) {
        refreshData();
      }
    }
  }, [currentMonth, refreshData]);

  const deleteExpense = useCallback((id: string) => {
    const data = { ...monthData };
    data.expenses = data.expenses.filter(e => e.id !== id);
    saveMonthData(data);
    refreshData();
  }, [monthData, refreshData]);

  const setBudget = useCallback((category: ExpenseCategory, limit: number) => {
    const data = { ...monthData };
    const existingIndex = data.budgets.findIndex(b => b.category === category);
    if (existingIndex !== -1) {
      data.budgets[existingIndex].limit = limit;
    } else {
      data.budgets.push({ category, limit });
    }
    saveMonthData(data);
    refreshData();
  }, [monthData, refreshData]);

  const removeBudget = useCallback((category: ExpenseCategory) => {
    const data = { ...monthData };
    data.budgets = data.budgets.filter(b => b.category !== category);
    saveMonthData(data);
    refreshData();
  }, [monthData, refreshData]);

  const addRecurringTemplate = useCallback((templateData: Omit<RecurringTemplate, 'id'>) => {
    const template: RecurringTemplate = {
      ...templateData,
      id: generateId(),
    };
    const data = { ...monthData };
    data.recurringTemplates.push(template);
    saveMonthData(data);
    refreshData();
  }, [monthData, refreshData]);

  const updateRecurringTemplate = useCallback((template: RecurringTemplate) => {
    const data = { ...monthData };
    const index = data.recurringTemplates.findIndex(t => t.id === template.id);
    if (index !== -1) {
      data.recurringTemplates[index] = template;
      saveMonthData(data);
      refreshData();
    }
  }, [monthData, refreshData]);

  const deleteRecurringTemplate = useCallback((id: string) => {
    const data = { ...monthData };
    data.recurringTemplates = data.recurringTemplates.filter(t => t.id !== id);
    saveMonthData(data);
    refreshData();
  }, [monthData, refreshData]);

  return (
    <ExpenseContext.Provider
      value={{
        currentMonth,
        setCurrentMonth,
        monthData,
        expenses: monthData.expenses,
        budgets: monthData.budgets,
        recurringTemplates: monthData.recurringTemplates,
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

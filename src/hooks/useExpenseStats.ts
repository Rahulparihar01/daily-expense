import { useMemo } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { 
  filterExpenses, 
  calculateTotalExpense, 
  calculateCategoryTotals,
  getTodayExpenses,
  getChartData,
  getBudgetStatus,
  getBudgetPercentage
} from '@/lib/expense-utils';
import { ExpenseCategory, ExpenseOwner } from '@/types/expense';

export function useFilteredExpenses() {
  const { expenses, filters } = useExpenses();
  
  return useMemo(() => filterExpenses(expenses, filters), [expenses, filters]);
}

export function useExpenseStats() {
  const { expenses, budgets } = useExpenses();
  const filteredExpenses = useFilteredExpenses();
  
  return useMemo(() => {
    const totalExpense = calculateTotalExpense(expenses);
    const filteredTotal = calculateTotalExpense(filteredExpenses);
    const todayExpenses = getTodayExpenses(expenses);
    const todayTotal = calculateTotalExpense(todayExpenses);
    const categoryTotals = calculateCategoryTotals(expenses);
    const categoryCount = Object.values(categoryTotals).filter(v => v > 0).length;
    
    // Owner-wise totals
    const husbandExpenses = expenses.filter(e => e.owner === 'husband');
    const wifeExpenses = expenses.filter(e => e.owner === 'wife');
    const husbandTotal = calculateTotalExpense(husbandExpenses);
    const wifeTotal = calculateTotalExpense(wifeExpenses);
    
    // Budget analysis
    const budgetAnalysis = budgets.map(budget => {
      const spent = categoryTotals[budget.category] || 0;
      return {
        ...budget,
        spent,
        remaining: budget.limit - spent,
        percentage: getBudgetPercentage(spent, budget.limit),
        status: getBudgetStatus(spent, budget.limit),
      };
    });
    
    const overBudgetCount = budgetAnalysis.filter(b => b.status === 'danger').length;
    const warningBudgetCount = budgetAnalysis.filter(b => b.status === 'warning').length;
    
    return {
      totalExpense,
      filteredTotal,
      todayTotal,
      todayExpenses,
      categoryTotals,
      categoryCount,
      budgetAnalysis,
      overBudgetCount,
      warningBudgetCount,
      expenseCount: expenses.length,
      husbandTotal,
      wifeTotal,
      husbandExpenseCount: husbandExpenses.length,
      wifeExpenseCount: wifeExpenses.length,
    };
  }, [expenses, filteredExpenses, budgets]);
}

export function useChartData() {
  const filteredExpenses = useFilteredExpenses();
  
  return useMemo(() => getChartData(filteredExpenses), [filteredExpenses]);
}

export function useCategorySpending(category: ExpenseCategory) {
  const { expenses, budgets } = useExpenses();
  
  return useMemo(() => {
    const spent = expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const budget = budgets.find(b => b.category === category);
    
    return {
      spent,
      budget: budget?.limit || 0,
      hasBudget: !!budget,
      percentage: budget ? getBudgetPercentage(spent, budget.limit) : 0,
      status: budget ? getBudgetStatus(spent, budget.limit) : 'safe' as const,
    };
  }, [expenses, budgets, category]);
}

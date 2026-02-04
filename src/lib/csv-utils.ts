import { Expense, ExpenseCategory, ExpenseOwner, ALL_CATEGORIES, ALL_OWNERS, CATEGORY_CONFIG, OWNER_CONFIG } from '@/types/expense';
import { format, parseISO, isValid } from 'date-fns';

// CSV Export
export function exportExpensesToCSV(expenses: Expense[]): string {
  const headers = ['Date', 'Category', 'Owner', 'Amount', 'Payment Method', 'Description', 'Is Recurring', 'Recurring Frequency'];
  
  const rows = expenses.map(expense => [
    expense.date,
    CATEGORY_CONFIG[expense.category]?.label || expense.category,
    OWNER_CONFIG[expense.owner]?.label || expense.owner,
    expense.amount.toString(),
    expense.paymentMethod || 'cash',
    expense.description || '',
    expense.isRecurring ? 'Yes' : 'No',
    expense.recurringFrequency || '',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// CSV Import
interface ImportResult {
  success: boolean;
  expenses: Omit<Expense, 'id' | 'createdAt'>[];
  errors: string[];
}

function parseCategoryFromLabel(label: string): ExpenseCategory | null {
  const normalized = label.toLowerCase().trim();
  
  // Try direct match
  if (ALL_CATEGORIES.includes(normalized as ExpenseCategory)) {
    return normalized as ExpenseCategory;
  }
  
  // Try matching by label
  for (const category of ALL_CATEGORIES) {
    if (CATEGORY_CONFIG[category].label.toLowerCase() === normalized) {
      return category;
    }
  }
  
  return null;
}

function parseOwnerFromLabel(label: string): ExpenseOwner | null {
  const normalized = label.toLowerCase().trim();
  
  // Try direct match
  if (ALL_OWNERS.includes(normalized as ExpenseOwner)) {
    return normalized as ExpenseOwner;
  }
  
  // Try matching by label
  for (const owner of ALL_OWNERS) {
    if (OWNER_CONFIG[owner].label.toLowerCase() === normalized) {
      return owner;
    }
  }
  
  return null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function parseCSVToExpenses(csvContent: string): ImportResult {
  const lines = csvContent.trim().split('\n');
  const errors: string[] = [];
  const expenses: Omit<Expense, 'id' | 'createdAt'>[] = [];
  
  if (lines.length < 2) {
    return { success: false, expenses: [], errors: ['CSV file is empty or has no data rows'] };
  }
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const [dateStr, categoryStr, ownerStr, amountStr, description, isRecurringStr, frequencyStr] = values;
    
    // Validate date
    let date: string;
    try {
      const parsed = parseISO(dateStr);
      if (!isValid(parsed)) {
        // Try other common formats
        const dateParts = dateStr.split(/[-/]/);
        if (dateParts.length === 3) {
          // Assume YYYY-MM-DD or DD-MM-YYYY or MM-DD-YYYY
          const [first, second, third] = dateParts;
          if (first.length === 4) {
            date = `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
          } else if (third.length === 4) {
            date = `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
          } else {
            throw new Error('Invalid date format');
          }
        } else {
          throw new Error('Invalid date format');
        }
      } else {
        date = format(parsed, 'yyyy-MM-dd');
      }
    } catch {
      errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
      continue;
    }
    
    // Validate category
    const category = parseCategoryFromLabel(categoryStr);
    if (!category) {
      errors.push(`Row ${i + 1}: Invalid category "${categoryStr}"`);
      continue;
    }
    
    // Validate owner
    const owner = parseOwnerFromLabel(ownerStr);
    if (!owner) {
      errors.push(`Row ${i + 1}: Invalid owner "${ownerStr}". Must be "Husband" or "Wife"`);
      continue;
    }
    
    // Validate amount
    const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`);
      continue;
    }
    
    // Parse recurring
    const isRecurring = isRecurringStr?.toLowerCase() === 'yes' || isRecurringStr?.toLowerCase() === 'true';
    let recurringFrequency: 'daily' | 'weekly' | 'monthly' | null = null;
    if (isRecurring && frequencyStr) {
      const freq = frequencyStr.toLowerCase().trim();
      if (['daily', 'weekly', 'monthly'].includes(freq)) {
        recurringFrequency = freq as 'daily' | 'weekly' | 'monthly';
      }
    }
    
    expenses.push({
      date,
      category,
      owner,
      amount,
      description: description || undefined,
      paymentMethod: 'cash',
      isRecurring,
      recurringFrequency,
    });
  }
  
  return {
    success: expenses.length > 0,
    expenses,
    errors,
  };
}

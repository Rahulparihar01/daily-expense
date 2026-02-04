import { Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/context/ExpenseContext';
import { useAuth } from '@/context/AuthContext';
import { exportExpensesToCSV, downloadCSV } from '@/lib/csv-utils';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseCategory, ExpenseOwner } from '@/types/expense';

export function DataManager() {
  const { currentMonth, expenses } = useExpenses();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleExportCurrentMonth = () => {
    const csvContent = exportExpensesToCSV(expenses);
    downloadCSV(csvContent, `expenses-${currentMonth}.csv`);
    
    toast({
      title: 'CSV Export successful',
      description: `Downloaded expenses-${currentMonth}.csv`,
    });
  };

  const handleExportAllMonths = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const allExpenses: Expense[] = data.map(e => ({
        id: e.id,
        date: e.date,
        category: e.category as ExpenseCategory,
        owner: e.owner as ExpenseOwner,
        amount: parseFloat(e.amount.toString()),
        description: e.description || undefined,
        paymentMethod: (e as any).payment_method || 'cash',
        isRecurring: e.is_recurring,
        recurringFrequency: e.recurring_frequency as Expense['recurringFrequency'],
        recurringTemplateId: e.recurring_template_id || undefined,
        createdAt: e.created_at,
      }));

      const csvContent = exportExpensesToCSV(allExpenses);
      downloadCSV(csvContent, `all-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      toast({
        title: 'CSV Export successful',
        description: `Downloaded all expenses (${allExpenses.length} records)`,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to fetch all expenses',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Data Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleExportCurrentMonth}
        >
          <Download className="h-4 w-4" />
          Export {format(parseISO(`${currentMonth}-01`), 'MMMM yyyy')} as CSV
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleExportAllMonths}
        >
          <Download className="h-4 w-4" />
          Export All Months as CSV
        </Button>
        
        <p className="text-xs text-muted-foreground mt-2">
          Export your expense data as CSV file for backup or use in spreadsheet applications.
        </p>
      </CardContent>
    </Card>
  );
}

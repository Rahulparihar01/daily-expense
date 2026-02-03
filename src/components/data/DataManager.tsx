import { Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/context/ExpenseContext';
import { exportExpensesToCSV, downloadCSV } from '@/lib/csv-utils';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

export function DataManager() {
  const { currentMonth, expenses } = useExpenses();
  const { toast } = useToast();

  const handleExportCSV = () => {
    const csvContent = exportExpensesToCSV(expenses);
    downloadCSV(csvContent, `expenses-${currentMonth}.csv`);
    
    toast({
      title: 'CSV Export successful',
      description: `Downloaded expenses-${currentMonth}.csv`,
    });
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
          onClick={handleExportCSV}
        >
          <Download className="h-4 w-4" />
          Export {format(parseISO(`${currentMonth}-01`), 'MMMM yyyy')} as CSV
        </Button>
        
        <p className="text-xs text-muted-foreground mt-2">
          Export your expense data as CSV file for backup or use in spreadsheet applications.
        </p>
      </CardContent>
    </Card>
  );
}

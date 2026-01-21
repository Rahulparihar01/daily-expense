import { useState, useRef } from 'react';
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/context/ExpenseContext';
import { exportMonthData, exportAllData, importMonthData } from '@/lib/storage';
import { exportExpensesToCSV, downloadCSV, parseCSVToExpenses } from '@/lib/csv-utils';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function DataManager() {
  const { currentMonth, expenses, addExpense, refreshData } = useExpenses();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportMonth = () => {
    const data = exportMonthData(currentMonth);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${currentMonth}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export successful',
      description: `Downloaded expenses-${currentMonth}.json`,
    });
  };

  const handleExportAll = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses-all.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export successful',
      description: 'Downloaded all expense data',
    });
  };

  const handleExportCSV = () => {
    const csvContent = exportExpensesToCSV(expenses);
    downloadCSV(csvContent, `expenses-${currentMonth}.csv`);
    
    toast({
      title: 'CSV Export successful',
      description: `Downloaded expenses-${currentMonth}.csv`,
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importMonthData(content);
      
      if (result) {
        refreshData();
        toast({
          title: 'Import successful',
          description: `Imported data for ${format(parseISO(`${result.month}-01`), 'MMMM yyyy')}`,
        });
      } else {
        toast({
          title: 'Import failed',
          description: 'Invalid JSON file format',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const result = parseCSVToExpenses(content);
      
      if (result.success && result.expenses.length > 0) {
        // Add all expenses
        let successCount = 0;
        for (const expense of result.expenses) {
          try {
            await addExpense(expense);
            successCount++;
          } catch (error) {
            console.error('Error adding expense:', error);
          }
        }
        
        if (result.errors.length > 0) {
          setImportErrors(result.errors);
          setShowErrorDialog(true);
        }
        
        toast({
          title: 'CSV Import complete',
          description: `Successfully imported ${successCount} expenses${result.errors.length > 0 ? ` (${result.errors.length} rows had errors)` : ''}`,
        });
      } else {
        toast({
          title: 'Import failed',
          description: result.errors[0] || 'Could not parse CSV file',
          variant: 'destructive',
        });
      }
      
      setIsImporting(false);
    };
    reader.readAsText(file);
    
    // Reset input
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileJson className="h-5 w-5 text-primary" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* JSON Export */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleExportMonth}
          >
            <Download className="h-4 w-4" />
            Export {format(parseISO(`${currentMonth}-01`), 'MMMM yyyy')} (JSON)
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleExportAll}
          >
            <Download className="h-4 w-4" />
            Export All Months (JSON)
          </Button>

          {/* CSV Export */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleExportCSV}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export as CSV/Excel
          </Button>
          
          {/* JSON Import */}
          <div className="relative">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Upload className="h-4 w-4" />
              Import JSON File
            </Button>
          </div>

          {/* CSV Import */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              ref={csvInputRef}
              onChange={handleImportCSV}
              disabled={isImporting}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              disabled={isImporting}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {isImporting ? 'Importing...' : 'Import CSV File'}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Export your expense data as JSON or CSV files for backup. Import CSV files with columns: Date, Category, Owner, Amount, Description, Is Recurring, Recurring Frequency.
          </p>
        </CardContent>
      </Card>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Import Warnings
            </DialogTitle>
            <DialogDescription>
              Some rows could not be imported:
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {importErrors.map((error, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                • {error}
              </p>
            ))}
          </div>
          <Button onClick={() => setShowErrorDialog(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

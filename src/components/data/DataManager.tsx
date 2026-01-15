import { useState, useRef } from 'react';
import { Download, Upload, FileJson } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/context/ExpenseContext';
import { exportMonthData, exportAllData, importMonthData } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

export function DataManager() {
  const { currentMonth, refreshData } = useExpenses();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileJson className="h-5 w-5 text-primary" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleExportMonth}
        >
          <Download className="h-4 w-4" />
          Export {format(parseISO(`${currentMonth}-01`), 'MMMM yyyy')}
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleExportAll}
        >
          <Download className="h-4 w-4" />
          Export All Months
        </Button>
        
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
        
        <p className="text-xs text-muted-foreground mt-2">
          Export your expense data as JSON files for backup or import previously exported data.
        </p>
      </CardContent>
    </Card>
  );
}

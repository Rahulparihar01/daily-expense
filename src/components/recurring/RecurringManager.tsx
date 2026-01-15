import { RefreshCw, Trash2, Pause, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExpenses } from '@/context/ExpenseContext';
import { CATEGORY_CONFIG } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/expense-utils';

export function RecurringManager() {
  const { recurringTemplates, updateRecurringTemplate, deleteRecurringTemplate } = useExpenses();

  const toggleActive = (id: string) => {
    const template = recurringTemplates.find(t => t.id === id);
    if (template) {
      updateRecurringTemplate({
        ...template,
        isActive: !template.isActive,
      });
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <RefreshCw className="h-5 w-5 text-primary" />
          Recurring Expenses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recurringTemplates.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No recurring expenses. Create one when adding an expense.
          </div>
        ) : (
          recurringTemplates.map(template => (
            <div 
              key={template.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
            >
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${CATEGORY_CONFIG[template.category].color}20` }}
              >
                {CATEGORY_CONFIG[template.category].icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {CATEGORY_CONFIG[template.category].label}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {template.frequency}
                  </Badge>
                  {!template.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Paused
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Started {formatDate(template.startDate)}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm mr-2">
                  {formatCurrency(template.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleActive(template.id)}
                >
                  {template.isActive ? (
                    <Pause className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Play className="h-4 w-4 text-primary" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteRecurringTemplate(template.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

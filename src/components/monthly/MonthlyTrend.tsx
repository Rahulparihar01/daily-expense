import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency } from '@/lib/expense-utils';
import { OWNER_CONFIG } from '@/types/expense';
import { format, parseISO, startOfMonth } from 'date-fns';

export function MonthlyTrend() {
  const { expenses } = useExpenses();

  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { husband: number; wife: number }> = {};

    expenses.forEach(expense => {
      const monthKey = format(startOfMonth(parseISO(expense.date)), 'yyyy-MM');
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { husband: 0, wife: 0 };
      }
      monthMap[monthKey][expense.owner] += expense.amount;
    });

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, data]) => ({
        month: format(parseISO(`${month}-01`), 'MMM yyyy'),
        husband: data.husband,
        wife: data.wife,
        total: data.husband + data.wife,
      }));
  }, [expenses]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, p: any) => sum + p.value, 0);
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((p: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: p.color }}>
              {p.name}: {formatCurrency(p.value)}
            </p>
          ))}
          <p className="text-sm font-semibold mt-2 pt-2 border-t">
            Total: {formatCurrency(total)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (monthlyData.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>📊 Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No expense data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>📊 Monthly Expense Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="husband" 
                name={OWNER_CONFIG.husband.label} 
                fill={OWNER_CONFIG.husband.color} 
                radius={[4, 4, 0, 0]}
                stackId="stack"
              />
              <Bar 
                dataKey="wife" 
                name={OWNER_CONFIG.wife.label} 
                fill={OWNER_CONFIG.wife.color} 
                radius={[4, 4, 0, 0]}
                stackId="stack"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

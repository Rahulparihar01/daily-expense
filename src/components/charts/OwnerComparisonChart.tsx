import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency, calculateTotalExpense } from '@/lib/expense-utils';
import { OWNER_CONFIG, ExpenseOwner } from '@/types/expense';

export function OwnerComparisonChart() {
  const { expenses } = useExpenses();

  const husbandExpenses = expenses.filter(e => e.owner === 'husband');
  const wifeExpenses = expenses.filter(e => e.owner === 'wife');

  const data = [
    {
      name: OWNER_CONFIG.husband.label,
      amount: calculateTotalExpense(husbandExpenses),
      count: husbandExpenses.length,
      owner: 'husband' as ExpenseOwner,
    },
    {
      name: OWNER_CONFIG.wife.label,
      amount: calculateTotalExpense(wifeExpenses),
      count: wifeExpenses.length,
      owner: 'wife' as ExpenseOwner,
    },
  ];

  const totalExpense = calculateTotalExpense(expenses);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalExpense > 0 ? ((data.amount / totalExpense) * 100).toFixed(1) : 0;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium flex items-center gap-2">
            {OWNER_CONFIG[data.owner as ExpenseOwner].icon} {data.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="font-semibold text-foreground">{formatCurrency(data.amount)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Transactions: <span className="font-semibold text-foreground">{data.count}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Share: <span className="font-semibold text-foreground">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👨‍👩‍👧 Owner Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="category" 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                type="number"
                tickFormatter={(value) => formatCurrency(value)}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={80}>
                <LabelList 
                  dataKey="amount" 
                  position="top" 
                  formatter={(value: number) => formatCurrency(value)}
                  className="text-xs font-medium"
                  fill="hsl(var(--foreground))"
                />
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={OWNER_CONFIG[entry.owner].color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

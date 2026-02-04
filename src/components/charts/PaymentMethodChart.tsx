import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency } from '@/lib/expense-utils';
import { PAYMENT_METHOD_CONFIG, PaymentMethod, ALL_PAYMENT_METHODS } from '@/types/expense';
import { CreditCard } from 'lucide-react';

export function PaymentMethodChart() {
  const { expenses } = useExpenses();

  const chartData = ALL_PAYMENT_METHODS.map(method => {
    const methodExpenses = expenses.filter(e => e.paymentMethod === method);
    const total = methodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = methodExpenses.length;
    
    return {
      method,
      label: `${PAYMENT_METHOD_CONFIG[method].icon} ${PAYMENT_METHOD_CONFIG[method].label}`,
      amount: total,
      count,
      fill: PAYMENT_METHOD_CONFIG[method].color,
    };
  });

  const hasData = chartData.some(d => d.amount > 0);

  if (!hasData) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No expense data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Methods
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `₹${value}`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Bar 
                dataKey="amount" 
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              >
                <LabelList 
                  dataKey="amount" 
                  position="top" 
                  formatter={(value: number) => formatCurrency(value)}
                  style={{ fontSize: '11px', fontWeight: 500 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          {chartData.map(item => (
            <div key={item.method} className="text-center">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="text-sm font-medium">{item.count} txns</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

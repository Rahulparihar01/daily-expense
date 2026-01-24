import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useExpenses } from '@/context/ExpenseContext';
import { formatCurrency } from '@/lib/expense-utils';
import { CATEGORY_CONFIG, OWNER_CONFIG, ExpenseCategory, ExpenseOwner } from '@/types/expense';

interface PieDataItem {
  name: string;
  value: number;
  color: string;
  category: ExpenseCategory;
}

function getOwnerChartData(expenses: { category: ExpenseCategory; amount: number }[]): PieDataItem[] {
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  return Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([category, value]) => ({
      name: CATEGORY_CONFIG[category as ExpenseCategory].label,
      value,
      color: CATEGORY_CONFIG[category as ExpenseCategory].color,
      category: category as ExpenseCategory,
    }));
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="hsl(var(--foreground))" className="text-sm font-medium">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
        {formatCurrency(value)}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};

interface PieChartViewProps {
  data: PieDataItem[];
  activeIndex: number | undefined;
  onPieEnter: (_: any, index: number) => void;
  onPieLeave: () => void;
  onCategoryClick: (category: ExpenseCategory) => void;
}

function PieChartView({ data, activeIndex, onPieEnter, onPieLeave, onCategoryClick }: PieChartViewProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px]">
        <p className="text-muted-foreground text-sm">No data to display</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
          onClick={(_, index) => onCategoryClick(data[index].category)}
          style={{ cursor: 'pointer' }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        />
        <Legend 
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ paddingTop: '20px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart() {
  const { expenses, filters, setFilters } = useExpenses();
  const [selectedOwners, setSelectedOwners] = useState<ExpenseOwner[]>(['husband', 'wife']);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const filteredExpenses = expenses.filter(e => selectedOwners.includes(e.owner as ExpenseOwner));
  const chartData = getOwnerChartData(filteredExpenses);

  const handlePieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handlePieLeave = () => {
    setActiveIndex(undefined);
  };

  const handleCategoryClick = (category: ExpenseCategory) => {
    const currentCategories = filters.categories;
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    setFilters({
      ...filters,
      categories: newCategories,
    });
  };

  const toggleOwner = (owner: ExpenseOwner) => {
    setSelectedOwners(prev => 
      prev.includes(owner)
        ? prev.filter(o => o !== owner)
        : [...prev, owner]
    );
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Category Distribution</CardTitle>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedOwners.includes('husband')}
                onCheckedChange={() => toggleOwner('husband')}
              />
              <span className="flex items-center gap-1 text-sm">
                {OWNER_CONFIG.husband.icon} {OWNER_CONFIG.husband.label}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedOwners.includes('wife')}
                onCheckedChange={() => toggleOwner('wife')}
              />
              <span className="flex items-center gap-1 text-sm">
                {OWNER_CONFIG.wife.icon} {OWNER_CONFIG.wife.label}
              </span>
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <PieChartView 
          data={chartData}
          activeIndex={activeIndex}
          onPieEnter={handlePieEnter}
          onPieLeave={handlePieLeave}
          onCategoryClick={handleCategoryClick}
        />
        
        {filters.categories.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Active filters:</p>
            <div className="flex flex-wrap gap-1">
              {filters.categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label} ✕
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

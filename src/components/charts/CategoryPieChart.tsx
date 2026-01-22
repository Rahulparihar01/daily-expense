import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeTab, setActiveTab] = useState<'all' | ExpenseOwner>('all');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const husbandExpenses = expenses.filter(e => e.owner === 'husband');
  const wifeExpenses = expenses.filter(e => e.owner === 'wife');

  const allData = getOwnerChartData(expenses);
  const husbandData = getOwnerChartData(husbandExpenses);
  const wifeData = getOwnerChartData(wifeExpenses);

  const handlePieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handlePieLeave = () => {
    setActiveIndex(undefined);
  };

  const handleCategoryClick = (category: ExpenseCategory) => {
    // Toggle category filter
    const currentCategories = filters.categories;
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    setFilters({
      ...filters,
      categories: newCategories,
    });
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'husband':
        return husbandData;
      case 'wife':
        return wifeData;
      default:
        return allData;
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Category Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | ExpenseOwner)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="husband" className="flex items-center gap-1">
              {OWNER_CONFIG.husband.icon} {OWNER_CONFIG.husband.label}
            </TabsTrigger>
            <TabsTrigger value="wife" className="flex items-center gap-1">
              {OWNER_CONFIG.wife.icon} {OWNER_CONFIG.wife.label}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <PieChartView 
              data={allData}
              activeIndex={activeIndex}
              onPieEnter={handlePieEnter}
              onPieLeave={handlePieLeave}
              onCategoryClick={handleCategoryClick}
            />
          </TabsContent>
          
          <TabsContent value="husband" className="mt-0">
            <PieChartView 
              data={husbandData}
              activeIndex={activeIndex}
              onPieEnter={handlePieEnter}
              onPieLeave={handlePieLeave}
              onCategoryClick={handleCategoryClick}
            />
          </TabsContent>
          
          <TabsContent value="wife" className="mt-0">
            <PieChartView 
              data={wifeData}
              activeIndex={activeIndex}
              onPieEnter={handlePieEnter}
              onPieLeave={handlePieLeave}
              onCategoryClick={handleCategoryClick}
            />
          </TabsContent>
        </Tabs>
        
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

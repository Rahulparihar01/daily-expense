import { useState } from 'react';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useExpenses } from '@/context/ExpenseContext';
import { ALL_CATEGORIES, CATEGORY_CONFIG, ExpenseCategory } from '@/types/expense';
import { cn } from '@/lib/utils';

export function ExpenseFilters() {
  const { filters, setFilters, currentMonth, setCurrentMonth, availableMonths } = useExpenses();
  const [filterType, setFilterType] = useState<'all' | 'single' | 'range'>(filters.dateFilter.type);

  const handleDateTypeChange = (type: 'all' | 'single' | 'range') => {
    setFilterType(type);
    setFilters({
      ...filters,
      dateFilter: { type, startDate: undefined, endDate: undefined },
    });
  };

  const handleSingleDateChange = (date: Date | undefined) => {
    if (date) {
      setFilters({
        ...filters,
        dateFilter: {
          type: 'single',
          startDate: format(date, 'yyyy-MM-dd'),
        },
      });
    }
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setFilters({
      ...filters,
      dateFilter: {
        type: 'range',
        startDate: range.from ? format(range.from, 'yyyy-MM-dd') : undefined,
        endDate: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
      },
    });
  };

  const toggleCategory = (category: ExpenseCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    setFilters({
      ...filters,
      categories: newCategories,
    });
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilters({
      dateFilter: { type: 'all' },
      categories: [],
    });
  };

  const hasActiveFilters = filterType !== 'all' || filters.categories.length > 0;

  return (
    <Card className="shadow-soft">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <Select value={currentMonth} onValueChange={setCurrentMonth}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.length > 0 ? (
                availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {format(parseISO(`${month}-01`), 'MMMM yyyy')}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={currentMonth}>
                  {format(parseISO(`${currentMonth}-01`), 'MMMM yyyy')}
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border" />

          {/* Date Filter Type */}
          <Select value={filterType} onValueChange={(v) => handleDateTypeChange(v as any)}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="single">Single Date</SelectItem>
              <SelectItem value="range">Date Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Single Date Picker */}
          {filterType === 'single' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {filters.dateFilter.startDate 
                    ? format(parseISO(filters.dateFilter.startDate), 'MMM dd, yyyy')
                    : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFilter.startDate ? parseISO(filters.dateFilter.startDate) : undefined}
                  onSelect={handleSingleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Date Range Picker */}
          {filterType === 'range' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {filters.dateFilter.startDate && filters.dateFilter.endDate
                    ? `${format(parseISO(filters.dateFilter.startDate), 'MMM dd')} - ${format(parseISO(filters.dateFilter.endDate), 'MMM dd')}`
                    : 'Pick range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.dateFilter.startDate ? parseISO(filters.dateFilter.startDate) : undefined,
                    to: filters.dateFilter.endDate ? parseISO(filters.dateFilter.endDate) : undefined,
                  }}
                  onSelect={(range) => handleDateRangeChange(range || {})}
                  numberOfMonths={2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          <div className="h-6 w-px bg-border" />

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map(category => (
              <Badge
                key={category}
                variant={filters.categories.includes(category) ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all',
                  filters.categories.includes(category) && 'bg-primary hover:bg-primary/90'
                )}
                onClick={() => toggleCategory(category)}
              >
                {CATEGORY_CONFIG[category].icon} {CATEGORY_CONFIG[category].label}
              </Badge>
            ))}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

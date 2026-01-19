-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('milk', 'food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other')),
  owner TEXT NOT NULL CHECK (owner IN ('husband', 'wife')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly') OR recurring_frequency IS NULL),
  recurring_template_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
CREATE POLICY "Users can view their own expenses" 
  ON public.expenses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" 
  ON public.expenses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" 
  ON public.expenses FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" 
  ON public.expenses FOR DELETE 
  USING (auth.uid() = user_id);

-- Create recurring templates table
CREATE TABLE public.recurring_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('milk', 'food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other')),
  owner TEXT NOT NULL CHECK (owner IN ('husband', 'wife')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL,
  last_generated DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on recurring_templates
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurring_templates
CREATE POLICY "Users can view their own recurring templates" 
  ON public.recurring_templates FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring templates" 
  ON public.recurring_templates FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring templates" 
  ON public.recurring_templates FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring templates" 
  ON public.recurring_templates FOR DELETE 
  USING (auth.uid() = user_id);

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('milk', 'food', 'transport', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other')),
  month TEXT NOT NULL, -- YYYY-MM format
  budget_limit DECIMAL(10, 2) NOT NULL CHECK (budget_limit > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, month)
);

-- Enable RLS on budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- RLS policies for budgets
CREATE POLICY "Users can view their own budgets" 
  ON public.budgets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" 
  ON public.budgets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
  ON public.budgets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
  ON public.budgets FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_expenses_user_date ON public.expenses(user_id, date);
CREATE INDEX idx_expenses_user_category ON public.expenses(user_id, category);
CREATE INDEX idx_recurring_templates_user ON public.recurring_templates(user_id);
CREATE INDEX idx_budgets_user_month ON public.budgets(user_id, month);
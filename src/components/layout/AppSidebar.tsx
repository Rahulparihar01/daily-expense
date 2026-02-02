import { LayoutDashboard, PlusCircle, LogOut, Wallet, History, CalendarRange } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { title: 'Monthly', icon: CalendarRange, id: 'monthly' },
  { title: 'History', icon: History, id: 'history' },
];

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const { signOut, user } = useAuth();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className={cn(
          'flex items-center gap-3 transition-all',
          isCollapsed && 'justify-center'
        )}>
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">ExpenseTrack</h1>
              <p className="text-xs text-sidebar-foreground/60">Manage your finances</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeSection === item.id}
                    onClick={() => onSectionChange(item.id)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className={cn('px-2', isCollapsed && 'px-0 flex justify-center')}>
              <ExpenseForm 
                trigger={
                  isCollapsed ? (
                    <Button size="icon" className="h-10 w-10">
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button className="w-full gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Add Expense
                    </Button>
                  )
                }
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {!isCollapsed && user && (
          <p className="text-xs text-sidebar-foreground/60 truncate text-center">
            {user.email}
          </p>
        )}
        <Button 
          variant="outline" 
          size={isCollapsed ? "icon" : "default"}
          className={cn("w-full", isCollapsed && "h-10 w-10")}
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

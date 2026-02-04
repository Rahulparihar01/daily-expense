import { Bell, Check, CheckCheck, Trash2, X, AlertTriangle, DollarSign, Receipt } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications, Notification, NotificationType } from '@/hooks/useNotifications';

interface NotificationPanelProps {
  onClose?: () => void;
}

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bgColor: string }> = {
  expense_added: { icon: Receipt, color: 'text-primary', bgColor: 'bg-primary/10' },
  limit_warning: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  limit_reached: { icon: DollarSign, color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = useNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Bell className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No notifications</p>
        <p className="text-xs">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex gap-1">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>
              <CheckCheck className="h-3 w-3 mr-1" />
              Read all
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2 px-4 pb-4">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={cn(
                  'relative flex gap-2 p-2 rounded-lg border transition-colors',
                  notification.isRead 
                    ? 'bg-muted/30 border-border' 
                    : 'bg-card border-primary/20 shadow-sm'
                )}
              >
                <div className={cn('p-1.5 rounded-full h-fit', config.bgColor)}>
                  <Icon className={cn('h-3 w-3', config.color)} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className={cn(
                      'font-medium text-xs',
                      !notification.isRead && 'text-foreground'
                    )}>
                      {notification.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex gap-1 mt-1">
                    {!notification.isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 px-1 text-[10px]"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-2.5 w-2.5 mr-0.5" />
                        Read
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 px-1 text-[10px] text-muted-foreground hover:text-destructive"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <X className="h-2.5 w-2.5 mr-0.5" />
                      Dismiss
                    </Button>
                  </div>
                </div>

                {!notification.isRead && (
                  <div className="absolute top-2 left-2 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t px-4 py-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full h-7 text-xs text-muted-foreground hover:text-destructive"
          onClick={clearAllNotifications}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear all notifications
        </Button>
      </div>
    </div>
  );
}

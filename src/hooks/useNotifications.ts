import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type NotificationType = 'expense_added' | 'limit_warning' | 'limit_reached';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      // Use type assertion to bypass TypeScript's strict table name checking
      // since the notifications table was created dynamically
      const query = supabase
        .from('notifications' as 'expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: rawData, error } = await query;

      if (error) throw error;

      const mapped = ((rawData as unknown as NotificationRow[]) || []).map((n) => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        metadata: n.metadata || {},
        createdAt: n.created_at,
      }));

      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const addNotification = useCallback(async (
    type: NotificationType,
    title: string,
    message: string,
    metadata: Record<string, unknown> = {}
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications' as 'expenses')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          metadata,
        } as never);

      if (error) throw error;
      
      fetchNotifications();
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications' as 'expenses')
        .update({ is_read: true } as never)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const query = supabase
        .from('notifications' as 'expenses')
        .update({ is_read: true } as never)
        .eq('user_id', user.id);

      const { error } = await query;

      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const notification = notifications.find(n => n.id === id);
      
      const { error } = await supabase
        .from('notifications' as 'expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user, notifications]);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications' as 'expenses')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [user]);

  return {
    notifications,
    loading,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications: fetchNotifications,
  };
}

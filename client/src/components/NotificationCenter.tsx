import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Check,
  Trash2,
  DollarSign,
  Bot,
  Star,
  CreditCard,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationCenterProps {
  userId: string;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [], refetch } = trpc.notifications.getAll.useQuery(
    { userId, unreadOnly: false },
    { enabled: !!userId, refetchInterval: 30000 } // Refetch every 30 seconds
  );

  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(
    { userId },
    { enabled: !!userId, refetchInterval: 10000 } // Refetch every 10 seconds
  );

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();
  const deleteMutation = trpc.notifications.delete.useMutation();

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
      refetch();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync({ userId });
      toast.success('All notifications marked as read');
      refetch();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteMutation.mutateAsync({ notificationId, userId });
      refetch();
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case 'agent_update':
        return <Bot className="w-5 h-5 text-blue-400" />;
      case 'review':
        return <Star className="w-5 h-5 text-[#F1A70E]" />;
      case 'subscription':
        return <CreditCard className="w-5 h-5 text-purple-400" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (date: Date | string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-400 hover:text-white"
        >
          <Bell className="w-5 h-5" />
          {(unreadCount?.count || 0) > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#F1A70E] text-black text-xs"
            >
              {unreadCount!.count > 9 ? '9+' : unreadCount!.count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-gray-900 border-gray-800" align="end">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">Notifications</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-[#F1A70E] hover:text-[#F5B83D]"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm text-center">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-800/50 transition-colors ${!notification.read ? 'bg-gray-800/30' : ''
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-green-400"
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-400"
                            onClick={() => handleDelete(notification.id)}
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

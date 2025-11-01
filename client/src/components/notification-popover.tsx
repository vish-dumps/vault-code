
import { useState } from "react";
import { Bell, UserPlus, UserCheck, UserX, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";

type NotificationActor = {
  id: string;
  displayName?: string | null;
  username?: string | null;
  handle?: string | null;
};

type AppNotification = {
  id: string;
  type: "friend_request" | "friend_accepted" | "friend_declined" | "system";
  title: string;
  message: string;
  metadata?: {
    actor?: NotificationActor;
    [key: string]: unknown;
  };
  createdAt: string;
  readAt?: string | null;
};

type NotificationsResponse = {
  items: AppNotification[];
  unreadCount: number;
};

const notificationIcons: Record<AppNotification["type"], JSX.Element> = {
  friend_request: <UserPlus className="h-4 w-4 text-blue-500" />,
  friend_accepted: <UserCheck className="h-4 w-4 text-green-500" />,
  friend_declined: <UserX className="h-4 w-4 text-red-500" />,
  system: <Bell className="h-4 w-4 text-muted-foreground" />,
};

export function NotificationPopover() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications");
      return res.json();
    },
  });

  const notifications = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: async (payload: { ids?: string[]; all?: boolean }) => {
      const response = await apiRequest("POST", "/api/notifications/read", payload);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to update notifications");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/notifications/${id}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to delete notification");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/notifications");
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to clear notifications");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    markReadMutation.mutate({ all: true });
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.readAt) {
      markReadMutation.mutate({ ids: [notification.id] });
    }

    setOpen(false);

    if (notification.type === "friend_request") {
      setLocation("/community/friends?tab=requests");
    } else if (notification.type === "friend_accepted") {
      setLocation("/community/friends");
    }
  };

  const handleMarkRead = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    markReadMutation.mutate({ ids: [id] });
  };

  const handleRemove = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteMutation.mutate(id);
  };

  const handleClearAll = () => {
    if (!notifications.length) return;
    clearAllMutation.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative group hover:bg-blue-500/10 transition-all duration-300"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: [0, -12, 12, -8, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Bell className="h-5 w-5 text-blue-500" />
          </motion.div>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {unreadCount}
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-4 border-b flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-lg">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0 || markReadMutation.isPending}
              >
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={handleClearAll}
                disabled={!notifications.length || clearAllMutation.isPending}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Clear
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {notifications.map((notification, index) => {
                  const isRead = Boolean(notification.readAt);
                  const actor = notification.metadata?.actor;
                  const actorLabel =
                    actor?.displayName ??
                    actor?.username ??
                    actor?.handle ??
                    (actor ? "Someone" : undefined);

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01, x: 2 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                        isRead
                          ? "bg-secondary/40 hover:bg-secondary/60"
                          : "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/40"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {notificationIcons[notification.type] ?? notificationIcons.system}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-sm leading-tight">
                                {notification.title}
                              </h4>
                              {actorLabel && (
                                <p className="text-[11px] text-muted-foreground">
                                  From {actorLabel}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(event) => handleMarkRead(notification.id, event)}
                            disabled={markReadMutation.isPending}
                          >
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-500 hover:bg-red-500/10"
                          onClick={(event) => handleRemove(notification.id, event)}
                          disabled={deleteMutation.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}

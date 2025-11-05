import { useState } from "react";
import * as React from "react";
import { User, Settings, LogOut, Trophy, Code2, Target, Sparkles, Info, MessageSquare, Heart } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function ProfilePopover() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const { data: userProfile, refetch } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/profile");
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  // Refetch profile data when popover opens to get real-time stats
  React.useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    setLocation("/auth");
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    setLocation(path);
  };

  // Stats removed as per user request - XP and streak info available in profile page

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative group hover:bg-purple-500/10 transition-all duration-300 rounded-full"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Avatar className="h-8 w-8 border border-border/30">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.username} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/10">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-purple-500/20">
                <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.username} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">
                  {user?.name || user?.username || "User"}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 hover:bg-purple-500/10"
              onClick={() => handleNavigate("/profile")}
            >
              <User className="h-4 w-4" />
              View Profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 hover:bg-amber-500/10"
              onClick={() => handleNavigate("/guide")}
            >
              <Sparkles className="h-4 w-4" />
              Usage Playbook
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 hover:bg-blue-500/10"
              onClick={() => handleNavigate("/settings")}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 hover:bg-cyan-500/10"
              onClick={() => handleNavigate("/about")}
            >
              <Info className="h-4 w-4" />
              About
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 hover:bg-green-500/10"
              onClick={() => handleNavigate("/feedback")}
            >
              <MessageSquare className="h-4 w-4" />
              Feedback
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 hover:bg-pink-500/10"
              onClick={() => handleNavigate("/support")}
            >
              <Heart className="h-4 w-4" />
              Support Us
            </Button>
          </div>

          <Separator />

          {/* Logout */}
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-red-600 dark:text-red-400 hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}

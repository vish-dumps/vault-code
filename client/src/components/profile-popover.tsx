import { useState } from "react";
import { User, Settings, LogOut, Trophy, Code2, Target, Sparkles } from "lucide-react";
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

  const { data: userProfile } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/profile");
      return response.json();
    },
  });

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    setLocation("/auth");
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    setLocation(path);
  };

  const stats = [
    {
      icon: <Code2 className="h-4 w-4 text-blue-500" />,
      label: "Problems Solved",
      value: userProfile?.totalProblems ?? 0,
    },
    {
      icon: <Trophy className="h-4 w-4 text-yellow-500" />,
      label: "Current Streak",
      value: `${userProfile?.currentStreak ?? 0} days`,
    },
    {
      icon: <Target className="h-4 w-4 text-green-500" />,
      label: "Daily Goal",
      value: `${userProfile?.dailyGoal ?? 3} problems`,
    },
  ];

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

          {/* Quick Stats */}
          <div className="p-3 space-y-2">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-all duration-200"
              >
                <div className="flex-shrink-0">{stat.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-semibold text-sm">{stat.value}</p>
                </div>
              </motion.div>
            ))}
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

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationPopover } from "@/components/notification-popover";
import { StreakPopover } from "@/components/streak-popover";
import { ProfilePopover } from "@/components/profile-popover";
import { XpPill } from "@/components/xp-pill";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/dashboard";
import Questions from "@/pages/questions";
import AddQuestion from "@/pages/add-question";
import QuestionDetails from "@/pages/question-details";
import Workspace from "@/pages/workspace";
import Snippets from "@/pages/snippets";
import Contests from "@/pages/contests";
import Profile from "@/pages/profile";
import Guide from "@/pages/guide";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import RecentSolved from "@/pages/recent-solved";
import { useRealtimeSubscriptions } from "@/hooks/useRealtime";
import CommunityFriends from "@/pages/community/friends";
import CommunityProfile from "@/pages/community/profile";
import FriendProfile from "@/pages/community/friend-profile";
import Settings from "@/pages/settings";
import Feedback from "@/pages/feedback";
import About from "@/pages/about";
import Support from "@/pages/support";
import RoomPage from "@/pages/RoomPage";
import { OnboardingTutorial } from "@/components/onboarding-tutorial";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workspace" component={Workspace} />
      <Route path="/snippets" component={Snippets} />
      <Route path="/questions" component={Questions} />
      <Route path="/questions/add" component={AddQuestion} />
      <Route path="/questions/:id" component={QuestionDetails} />
      <Route path="/solved" component={RecentSolved} />
      <Route path="/contests" component={Contests} />
      <Route path="/profile" component={Profile} />
      <Route path="/guide" component={Guide} />
      <Route path="/community/friends/:friendId" component={FriendProfile} />
      <Route path="/community/friends" component={CommunityFriends} />
      <Route path="/u/:identity" component={CommunityProfile} />
      <Route path="/settings" component={Settings} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/about" component={About} />
      <Route path="/support" component={Support} />
      <Route path="/room/:id" component={RoomPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UnauthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route component={AuthPage} />
    </Switch>
  );
}

function AppContent() {
  useRealtimeSubscriptions();
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };
  const isDashboard = location === "/";
  const isRoomPage = location.startsWith("/room/");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center text-sm text-muted-foreground">Loading CodeVault...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <UnauthenticatedRoutes />;
  }

  // Room page gets full-screen layout without sidebar
  if (isRoomPage) {
    return <AuthenticatedRoutes />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-between border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <XpPill />
              <NotificationPopover />
              <StreakPopover />
              <ThemeToggle />
              <ProfilePopover />
            </div>
          </header>
          <main className={`flex-1 ${isDashboard ? "overflow-hidden" : "overflow-auto"}`}>
            <AuthenticatedRoutes />
          </main>
        </div>
      </div>
      <OnboardingTutorial />
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <ThemeProvider>
              <AppContent />
              <Toaster />
            </ThemeProvider>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

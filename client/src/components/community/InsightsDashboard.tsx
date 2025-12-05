import { useMemo } from "react";
import {
    Trophy,
    Zap,
    Activity,
    BarChart2,
    ArrowUpRight,
    Flame,
    UserPlus,
    CheckCircle,
    Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

type FriendSummary = {
    id: string;
    username: string;
    displayName?: string | null;
    handle?: string;
    avatar?: {
        type?: string;
        customUrl?: string | null;
        gender?: string | null;
        seed?: number | null;
    };
    xp?: number;
    streak?: number;
};

type ActivityItem = {
    id: string;
    summary: string;
    createdAt: string;
    user?: {
        id: string;
        displayName?: string | null;
        username?: string;
    };
    details?: Record<string, unknown>;
};

type ActiveRoom = {
    roomId: string;
    meetLink: string;
    createdAt: string;
    createdByName: string;
    createdBy: string;
    questionLink?: string | null;
};

interface InsightsDashboardProps {
    friends: FriendSummary[];
    activities: ActivityItem[];
    activeRooms?: ActiveRoom[];
    currentUser: {
        id: string;
        username: string;
        displayName?: string | null;
        xp?: number;
        streak?: number;
    };
}

function getAvatarUrl(friend: FriendSummary | { avatar?: FriendSummary["avatar"] }) {
    const avatar = friend.avatar;
    if (!avatar) return null;
    if (avatar.customUrl) return avatar.customUrl;
    if (avatar.type === "random") {
        const genderPath = avatar.gender === "female" ? "girl" : "boy";
        const seed = avatar.seed ?? (friend as any).id ?? "codevault";
        return `https://avatar.iran.liara.run/public/${genderPath}?username=${seed}`;
    }
    return null;
}

export function InsightsDashboard({ friends, activities, activeRooms = [], currentUser }: InsightsDashboardProps) {
    const [, setLocation] = useLocation();

    // Calculate Ranks
    const sortedByXP = useMemo(() => {
        const allUsers = [
            ...friends,
            { ...currentUser, isSelf: true }
        ];
        return allUsers.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0));
    }, [friends, currentUser]);

    const userRank = sortedByXP.findIndex(u => (u as any).isSelf) + 1;
    const topPercent = Math.max(1, Math.round((userRank / sortedByXP.length) * 100));

    // Prepare Momentum Data (Top 4 + Self)
    const momentumData = useMemo(() => {
        // Get top 3 friends + self
        const topFriends = friends
            .sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0))
            .slice(0, 3);

        const data = [
            ...topFriends.map(f => ({
                name: f.displayName ?? f.username,
                xp: f.xp ?? 0,
                isSelf: false,
                color: "bg-blue-500"
            })),
            {
                name: "You",
                xp: currentUser.xp ?? 0,
                isSelf: true,
                color: "bg-emerald-500"
            }
        ].sort((a, b) => b.xp - a.xp);

        const maxXP = Math.max(...data.map(d => d.xp), 1);
        return data.map(d => ({
            ...d,
            progress: (d.xp / maxXP) * 100
        }));
    }, [friends, currentUser]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weekly Rank Card */}
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Global Rank</p>
                            <h3 className="text-3xl font-bold text-white mt-1">#{userRank}</h3>
                            <p className="text-xs text-indigo-300 mt-2 flex items-center">
                                <ArrowUpRight size={12} className="mr-1" /> Top {topPercent}% of circle
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                            <Trophy size={24} />
                        </div>
                    </div>
                </div>

                {/* Active Streak Card */}
                <div className="bg-gradient-to-br from-amber-900/20 to-slate-900 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/40 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Active Streak</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{currentUser.streak ?? 0} <span className="text-sm font-normal text-slate-500">days</span></h3>
                            <p className="text-xs text-amber-500 mt-2 flex items-center">
                                <Flame size={12} className="mr-1" fill="currentColor" /> Keep it burning!
                            </p>
                        </div>
                        <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                            <Zap size={24} />
                        </div>
                    </div>
                </div>

                {/* Total XP Card */}
                <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Total XP</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{currentUser.xp?.toLocaleString() ?? 0}</h3>
                            <p className="text-xs text-emerald-400 mt-2">
                                Lifetime earned
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                            <Activity size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Rooms Compact Indicator */}
            {activeRooms.length > 0 && (
                <div className="flex justify-end">
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <Button variant="outline" className="gap-2 border-purple-500/50 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                                <Video size={16} />
                                <span>{activeRooms.length} Live Room{activeRooms.length !== 1 ? 's' : ''}</span>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                </span>
                            </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-0 border-purple-500/20 bg-slate-900/95 backdrop-blur-xl">
                            <div className="p-4 border-b border-purple-500/20 bg-purple-500/5">
                                <h4 className="font-semibold text-sm text-purple-100 flex items-center gap-2">
                                    <Video size={14} /> Live Sessions
                                </h4>
                            </div>
                            <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                                {activeRooms.map((room) => (
                                    <div key={room.roomId} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-purple-500/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium text-sm text-slate-200">{room.createdByName}'s Room</p>
                                                <p className="text-[10px] text-slate-400">
                                                    Started {formatDistanceToNow(new Date(room.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="w-full h-7 text-xs bg-purple-600 hover:bg-purple-700"
                                            onClick={() => setLocation(`/room/${room.roomId}?meet=${encodeURIComponent(room.meetLink)}`)}
                                        >
                                            Join Room
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Momentum Chart */}
                <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-slate-100 flex items-center">
                            <BarChart2 size={18} className="mr-2 text-teal-400" />
                            XP Leaderboard
                        </h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                            All Time
                        </span>
                    </div>

                    <div className="space-y-6">
                        {momentumData.map((item, index) => (
                            <div key={index} className="relative group">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className={`font-medium ${item.isSelf ? 'text-white' : 'text-slate-400'}`}>{item.name}</span>
                                    <span className="text-slate-500">{item.xp} XP</span>
                                </div>
                                <div className="h-3 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.color} shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-1000 ease-out group-hover:brightness-110`}
                                        style={{ width: `${item.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {momentumData.length === 0 && (
                            <div className="text-center text-slate-500 py-8">
                                No data available yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="font-semibold text-slate-100 mb-6 flex items-center">
                        <Activity size={18} className="mr-2 text-blue-400" />
                        Recent Activity
                    </h3>

                    <div className="space-y-6 relative">
                        {/* Vertical Line */}
                        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-700/50"></div>

                        {activities.length === 0 ? (
                            <div className="text-center text-slate-500 py-4 text-sm">
                                No recent activity.
                            </div>
                        ) : (
                            activities.slice(0, 5).map((activity) => {
                                const isConnect = activity.summary.includes("friend");
                                const isSolve = activity.summary.toLowerCase().includes("solv");
                                const isAchievement = !isConnect && !isSolve;

                                return (
                                    <div key={activity.id} className="relative flex items-start pl-8 group">
                                        <div className={`absolute left-0 w-5 h-5 rounded-full border-2 border-slate-800 flex items-center justify-center z-10 transition-transform group-hover:scale-110
                      ${isConnect ? 'bg-blue-500' :
                                                isSolve ? 'bg-emerald-500' : 'bg-amber-500'
                                            }
                    `}>
                                            {isConnect && <UserPlus size={10} className="text-white" />}
                                            {isSolve && <CheckCircle size={10} className="text-white" />}
                                            {isAchievement && <Trophy size={10} className="text-white" />}
                                        </div>

                                        <div>
                                            <p className="text-sm text-slate-300 leading-snug">
                                                <span className="font-semibold text-white hover:underline cursor-pointer">
                                                    {activity.user?.displayName ?? activity.user?.username}
                                                </span>
                                                <span className="text-slate-500"> {activity.summary} </span>
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
                                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Code2, BarChart2, Unplug, Loader2 } from "lucide-react";
import { toTitleCase } from "@/lib/text";
import { cn } from "@/lib/utils";

interface ExternalStatsProps {
    externalStats: any;
    className?: string;
    leetcodeUsername?: string;
    codeforcesUsername?: string;
    isLoading?: boolean;
}

export function ExternalStatsCard({ externalStats, className, leetcodeUsername, codeforcesUsername, isLoading }: ExternalStatsProps) {
    const [, setLocation] = useLocation();

    const hasStats = externalStats?.leetcode || externalStats?.codeforces;



    if (isLoading) {
        return (
            <Card className={cn(
                "relative h-full overflow-hidden border flex flex-col items-center justify-center p-8 shadow-xl",
                "bg-card border-border",
                className
            )}>
                {/* Content Wrapper */}
                <div className="relative z-10 flex flex-col items-center gap-4 text-center animate-in fade-in duration-500">

                    {/* Animated Icon Container */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                        <div className="bg-secondary/30 p-4 rounded-full border border-border/50 relative">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-foreground">
                            Checking how hard you’ve<br />been grinding 👀
                        </h3>
                        <p className="text-xs text-muted-foreground animate-pulse">
                            Syncing with the mothership...
                        </p>
                    </div>
                </div>

                {/* Subtle Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80 pointer-events-none" />
            </Card>
        );
    }

    const isConnected = !!leetcodeUsername || !!codeforcesUsername;

    if (!isConnected) {
        return (
            <Card className={cn(
                "relative h-full overflow-hidden border flex flex-col items-center justify-center p-8 shadow-xl",
                "bg-card border-border",
                className
            )}>
                {/* Content Wrapper */}
                <div className="relative z-10 flex flex-col items-center gap-4 text-center">

                    {/* Icon */}
                    <div className="bg-secondary/20 p-3 rounded-full border border-border">
                        <Unplug className="w-6 h-6 text-primary" />
                    </div>

                    {/* Text */}
                    <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">Oops!</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            You don't have any<br />connected accounts.
                        </p>
                    </div>

                    {/* Connect Button */}
                    <Button
                        onClick={() => setLocation("/profile")}
                        className="mt-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/20 active:scale-95 border-0"
                    >
                        Connect Now
                    </Button>

                </div>

                {/* Kody Sad - Peaking from bottom left */}
                <div className="absolute -bottom-5 -left-4 w-40 h-40 z-20 pointer-events-none opacity-80 scale-[3]">
                    <img
                        src="/kody/kody-sad.png"
                        alt="Sad Kody"
                        className="w-full h-full object-contain transform rotate-6"
                    />
                </div>

                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 pointer-events-none z-10" />
            </Card>
        );
    }

    return (
        <Card className={cn(
            "relative h-full overflow-hidden border shadow-xl p-4 font-sans select-none",
            "bg-card border-border",
            className
        )}>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">External stats</p>
                    <CardTitle className="text-lg font-semibold text-foreground">Competitive</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-secondary/50 text-xs text-foreground border-0">
                    Live
                </Badge>
            </div>

            {/* Content Wrapper (z-index higher than the kody sticker) */}
            <div className="flex flex-col gap-3 relative z-10">

                {/* Card 1: LeetCode */}
                {externalStats?.leetcode && (
                    <div
                        onClick={() => leetcodeUsername && window.open(`https://leetcode.com/u/${leetcodeUsername}/`, '_blank')}
                        className={cn(
                            "bg-secondary/20 rounded-xl p-4 border border-border transition-all duration-200 group",
                            leetcodeUsername ? "cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5" : "hover:border-border/80"
                        )}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-muted-foreground text-sm font-medium tracking-wide group-hover:text-emerald-500 transition-colors">LeetCode</span>
                            {/* LeetCode Icon */}
                            <Code2 className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        </div>

                        {/* Rating (Big Number) */}
                        <div className="text-3xl font-bold text-foreground mb-1">
                            {externalStats.leetcode.contest?.rating
                                ? Math.round(externalStats.leetcode.contest.rating)
                                : "N/A"}
                        </div>

                        {/* Subtext: Rank & Solved */}
                        <div className="text-[11px] text-muted-foreground font-medium whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
                            <span>
                                Rank: {(externalStats.leetcode.contest?.globalRanking || 0).toLocaleString()}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                            <span>
                                Solved: {externalStats.leetcode.solved?.find((x: any) => x.difficulty === "All")?.count || 0}
                            </span>
                        </div>

                        {/* Difficulty Breakdown */}
                        <div className="grid grid-cols-3 gap-2 mt-3 w-full">
                            <div className="flex flex-col items-center bg-background/50 rounded-lg p-2 border border-border/50">
                                <span className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider">Easy</span>
                                <span className="text-sm font-bold text-foreground">
                                    {externalStats.leetcode.solved?.find((x: any) => x.difficulty === "Easy")?.count || 0}
                                </span>
                            </div>
                            <div className="flex flex-col items-center bg-background/50 rounded-lg p-2 border border-border/50">
                                <span className="text-[10px] text-yellow-500 font-medium uppercase tracking-wider">Med</span>
                                <span className="text-sm font-bold text-foreground">
                                    {externalStats.leetcode.solved?.find((x: any) => x.difficulty === "Medium")?.count || 0}
                                </span>
                            </div>
                            <div className="flex flex-col items-center bg-background/50 rounded-lg p-2 border border-border/50">
                                <span className="text-[10px] text-red-500 font-medium uppercase tracking-wider">Hard</span>
                                <span className="text-sm font-bold text-foreground">
                                    {externalStats.leetcode.solved?.find((x: any) => x.difficulty === "Hard")?.count || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Card 2: Codeforces */}
                {externalStats?.codeforces && (
                    <div
                        onClick={() => codeforcesUsername && window.open(`https://codeforces.com/profile/${codeforcesUsername}`, '_blank')}
                        className={cn(
                            "bg-secondary/20 rounded-xl p-4 border border-border transition-all duration-200 group",
                            codeforcesUsername ? "cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5" : "hover:border-border/80"
                        )}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-muted-foreground text-sm font-medium tracking-wide group-hover:text-blue-500 transition-colors">Codeforces</span>
                            {/* Chart Icon */}
                            <BarChart2 className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                            {externalStats.codeforces.rating || "Unrated"}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                            <span className="text-muted-foreground/70">Rank:</span> {toTitleCase(externalStats.codeforces.rank || "unrated")} • <span className="text-muted-foreground/70">Max:</span> {externalStats.codeforces.maxRating || 0}
                        </div>
                    </div>
                )}

            </div>

            {/* Kody Proud - Peaking from bottom left */}
            <div className="absolute -bottom-12 -right-6 w-36 h-36 z-20 pointer-events-none opacity-90 scale-[1.5]">
                <img
                    src="/kody/kody-proud.png"
                    alt="Proud Kody"
                    className="w-full h-full object-contain transform rotate-6 scale-x-[-1]"
                />
            </div>

            {/* Subtle Gradient Overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-40 pointer-events-none z-10" />

        </Card>
    );
}

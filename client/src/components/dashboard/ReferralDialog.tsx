import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, Share2, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function ReferralDialog({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    // Fallback if username is missing, though it shouldn't be for authorized users
    const referralLink = `${window.location.origin}/auth?ref=${user?.username || "codevault"}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast({
            title: "Link copied!",
            description: "Share it with your friends to earn rewards.",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#0B1120] border-gray-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                        <Gift className="w-6 h-6 text-orange-500" />
                        Refer & Earn Rewards
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Invite your friends to CodeVault and unlock exclusive perks for both of you!
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col items-center text-center gap-2">
                            <div className="p-2 bg-orange-500/20 rounded-full text-orange-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="text-sm font-semibold text-orange-100">Invite a Friend</div>
                            <p className="text-xs text-slate-400">They get a head start with 100 XP</p>
                        </div>
                        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center text-center gap-2">
                            <div className="p-2 bg-cyan-500/20 rounded-full text-cyan-400">
                                <Gift className="w-5 h-5" />
                            </div>
                            <div className="text-sm font-semibold text-cyan-100">You Receive</div>
                            <p className="text-xs text-slate-400">1 Streak Freeze & XP Booster</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Your Unique Referral Link</label>
                        <div className="flex items-center space-x-2">
                            <Input
                                readOnly
                                value={referralLink}
                                className="bg-black/30 border-gray-700 text-slate-300 font-mono text-sm h-10"
                            />
                            <Button size="icon" onClick={handleCopy} className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-0">
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        {copied && <p className="text-xs text-green-500 font-medium animate-in fade-in slide-in-from-top-1">Link copied to clipboard!</p>}
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5 text-xs text-slate-400 leading-relaxed">
                        <strong className="text-slate-200">Tip:</strong> Rewards are credited once your friend completes their first 3 daily challenges.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

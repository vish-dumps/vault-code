
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KodyPopupProps {
    variant: "achievement" | "streak-warning";
    message: string;
    isVisible: boolean;
    onClose: () => void;
    // Duration is no longer used for switching to static, but kept for interface/future compat
    duration?: number;
}

const VARIANTS = {
    achievement: {
        gif: "/kody/kody-e.gif",
        static: "/kody/kody-excited.png",
        // Fallback/Safety colors
        bubbleClass: "bg-orange-50 border-orange-200 text-orange-900 border",
    },
    "streak-warning": {
        gif: "/kody/kody-s.gif",
        static: "/kody/kody-sad.png",
        bubbleClass: "bg-rose-50 border-rose-200 text-rose-900 border",
    },
};

export function KodyPopup({
    variant,
    message,
    isVisible,
    onClose,
    duration = 2800,
}: KodyPopupProps) {
    const config = VARIANTS[variant];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 50 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed bottom-6 left-6 z-50 flex items-end gap-3 pointer-events-none sm:pointer-events-auto max-w-[90vw]"
                >
                    {/* Kody Character */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                        <img
                            src={config.gif}
                            alt="Kody"
                            className="w-full h-full object-contain drop-shadow-xl"
                        />
                    </div>

                    {/* Speech Bubble */}
                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className={`
              relative p-4 rounded-2xl rounded-bl-none shadow-lg max-w-xs mb-8
              ${config.bubbleClass} animate-in fade-in slide-in-from-bottom-2
            `}
                    >
                        <p className="text-sm font-medium leading-relaxed pr-6">
                            {message}
                        </p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-sm border hover:bg-slate-100"
                            onClick={onClose}
                        >
                            <X className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

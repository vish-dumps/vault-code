import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QuestionLinkDialogProps {
  open: boolean;
  initialValue?: string | null;
  onOpenChange: (open: boolean) => void;
  onSave: (link: string | null) => Promise<void> | void;
}

const normalizeLink = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, trimmed.startsWith("http") ? undefined : "https://");
    if (!/^https?:$/.test(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
};

export function QuestionLinkDialog({ open, initialValue, onOpenChange, onSave }: QuestionLinkDialogProps) {
  const { toast } = useToast();
  const [value, setValue] = useState(initialValue ?? "");
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(initialValue ?? "");
      setTouched(false);
      setIsSaving(false);
    }
  }, [open, initialValue]);

  const normalized = normalizeLink(value);
  const hasError = touched && value.trim().length > 0 && normalized === null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (hasError) {
      toast({ title: "Invalid link", description: "Use a valid http/https URL.", variant: "destructive" });
      return;
    }

    try {
      setIsSaving(true);
      await onSave(normalized);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update the question link.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      setIsSaving(true);
      await onSave(null);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not clear the question link.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach the question link</DialogTitle>
          <DialogDescription>
            Paste the problem URL you&apos;re discussing so everyone can open it quickly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="question-link" className="text-sm font-medium">
              Question URL
            </label>
            <Input
              id="question-link"
              placeholder="https://leetcode.com/problems/..."
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onBlur={() => setTouched(true)}
              autoFocus
            />
            {hasError && (
              <p className="text-xs text-destructive">Enter a valid http/https link or leave it blank.</p>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={handleClear} disabled={isSaving}>
              Clear link
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save link"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

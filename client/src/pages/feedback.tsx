import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, Send, MessageSquare, Bug, Lightbulb, Heart } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";

export default function Feedback() {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("general");
  const [feedbackText, setFeedbackText] = useState("");
  const [featureSuggestions, setFeatureSuggestions] = useState("");
  const [bugsEncountered, setBugsEncountered] = useState("");
  const [noteForCreator, setNoteForCreator] = useState("");

  const submitFeedback = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/feedback", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
      // Reset form
      setRating(0);
      setCategory("general");
      setFeedbackText("");
      setFeatureSuggestions("");
      setBugsEncountered("");
      setNoteForCreator("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!feedbackText.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide your feedback.",
        variant: "destructive",
      });
      return;
    }

    submitFeedback.mutate({
      rating,
      feedbackText,
      featureSuggestions,
      bugsEncountered,
      noteForCreator,
      category,
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">
          Help us improve CodeVault by sharing your thoughts, suggestions, and experiences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Share Your Feedback</CardTitle>
          <CardDescription>
            Your feedback helps us build a better CodeVault for everyone. We read every submission!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="space-y-2">
              <Label>Overall Rating *</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {rating === 5 && "Excellent! 🎉"}
                  {rating === 4 && "Great! 😊"}
                  {rating === 3 && "Good 👍"}
                  {rating === 2 && "Fair 😐"}
                  {rating === 1 && "Needs Improvement 😔"}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Feedback Category</Label>
              <RadioGroup value={category} onValueChange={setCategory}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="general" id="general" />
                  <Label htmlFor="general" className="flex items-center gap-2 cursor-pointer">
                    <MessageSquare className="w-4 h-4" />
                    General Feedback
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="feature" id="feature" />
                  <Label htmlFor="feature" className="flex items-center gap-2 cursor-pointer">
                    <Lightbulb className="w-4 h-4" />
                    Feature Request
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bug" id="bug" />
                  <Label htmlFor="bug" className="flex items-center gap-2 cursor-pointer">
                    <Bug className="w-4 h-4" />
                    Bug Report
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="improvement" id="improvement" />
                  <Label htmlFor="improvement" className="flex items-center gap-2 cursor-pointer">
                    <Heart className="w-4 h-4" />
                    Improvement Suggestion
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Main Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Your Feedback *</Label>
              <Textarea
                id="feedback"
                placeholder="Tell us what you think about CodeVault..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Feature Suggestions */}
            <div className="space-y-2">
              <Label htmlFor="features">Feature Suggestions (Optional)</Label>
              <Textarea
                id="features"
                placeholder="What features would you like to see in CodeVault?"
                value={featureSuggestions}
                onChange={(e) => setFeatureSuggestions(e.target.value)}
                rows={3}
              />
            </div>

            {/* Bugs Encountered */}
            <div className="space-y-2">
              <Label htmlFor="bugs">Bugs Encountered (Optional)</Label>
              <Textarea
                id="bugs"
                placeholder="Describe any bugs or issues you've encountered..."
                value={bugsEncountered}
                onChange={(e) => setBugsEncountered(e.target.value)}
                rows={3}
              />
            </div>

            {/* Note for Creator */}
            <div className="space-y-2">
              <Label htmlFor="note">Personal Note for Creator (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Any personal message or note you'd like to share..."
                value={noteForCreator}
                onChange={(e) => setNoteForCreator(e.target.value)}
                rows={2}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitFeedback.isPending}
            >
              {submitFeedback.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-1" />
            <div className="space-y-1">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                Thank You for Your Support!
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Your feedback helps make CodeVault better for everyone. Every suggestion is carefully
                reviewed and considered for future updates. We truly appreciate you taking the time
                to help us improve!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

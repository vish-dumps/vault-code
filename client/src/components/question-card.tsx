import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ExternalLink } from "lucide-react";

interface QuestionCardProps {
  id: string;
  title: string;
  platform: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  language: string;
  link?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
}

const difficultyColors = {
  Easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  Medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  Hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function QuestionCard({
  id,
  title,
  platform,
  difficulty,
  tags,
  language,
  link,
  onEdit,
  onDelete,
  onClick,
}: QuestionCardProps) {
  return (
    <Card 
      className="hover-elevate cursor-pointer"
      onClick={() => onClick(id)}
      data-testid={`card-question-${id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{title}</h3>
              {link && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(link, '_blank');
                  }}
                  data-testid={`button-open-link-${id}`}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {platform}
              </Badge>
              <Badge className={`text-xs ${difficultyColors[difficulty]}`}>
                {difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {language}
              </Badge>
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(id);
              }}
              data-testid={`button-edit-${id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              data-testid={`button-delete-${id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

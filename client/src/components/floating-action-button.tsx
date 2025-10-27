import { useState } from "react";
import { Plus, FileCode, BookOpen, Code2 } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function FloatingActionButton() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className={`h-14 px-6 rounded-full shadow-lg transition-all duration-300 ${
              isOpen ? "scale-95" : "hover:scale-105"
            } bg-gradient-to-r from-primary via-primary to-violet-600 hover:shadow-xl`}
          >
            <Plus className={`h-5 w-5 mr-2 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
            <span className="font-semibold">New</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 mb-2"
          sideOffset={8}
        >
          <DropdownMenuItem
            onClick={() => {
              setLocation("/questions/add");
              setIsOpen(false);
            }}
            className="cursor-pointer py-3"
          >
            <BookOpen className="h-4 w-4 mr-3" />
            <div>
              <div className="font-medium">Add Question</div>
              <div className="text-xs text-muted-foreground">Save a coding problem</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => {
              setLocation("/workspace");
              setIsOpen(false);
            }}
            className="cursor-pointer py-3"
          >
            <Code2 className="h-4 w-4 mr-3" />
            <div>
              <div className="font-medium">Add Snippet</div>
              <div className="text-xs text-muted-foreground">Save code snippet</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => {
              setLocation("/questions");
              setIsOpen(false);
            }}
            className="cursor-pointer py-2"
          >
            <FileCode className="h-4 w-4 mr-3" />
            <span>View All Questions</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

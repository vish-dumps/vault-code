import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Code2,
  Users,
  Link2,
  Copy,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  LogOut,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLiveRoom } from "@/hooks/useLiveRoom";
import { InviteFriendsDialog } from "@/components/meet-rooms/InviteFriendsDialog";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "go", label: "Go" },
];

const CURSOR_COLORS = [
  { background: "#f97316", stroke: "#c2410c" },
  { background: "#22c55e", stroke: "#15803d" },
  { background: "#3b82f6", stroke: "#1d4ed8" },
  { background: "#a855f7", stroke: "#7c3aed" },
  { background: "#ec4899", stroke: "#be185d" },
  { background: "#f59e0b", stroke: "#b45309" },
  { background: "#14b8a6", stroke: "#0f766e" },
  { background: "#f973ab", stroke: "#db2777" },
];

function getCursorColors(userId: string) {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(index);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[colorIndex];
}

function sanitizeForClassName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

export default function RoomPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();

  const roomId = params.id || null;
  const meetLinkFromUrl = new URLSearchParams(searchParams).get("meet");

  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [questionLinkInput, setQuestionLinkInput] = useState("");
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [codePanelSize, setCodePanelSize] = useState(35);
  const [showLoadingTimeout, setShowLoadingTimeout] = useState(false);

  const excalidrawRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const codeCursorDecorationsRef = useRef<string[]>([]);
  const remoteCursorClassMapRef = useRef(new Map<string, { caretClass: string; labelClass: string }>());
  const lastElementsSnapshotRef = useRef<string>("");
  const isApplyingRemoteUpdateRef = useRef(false);
  const emitThrottleTimerRef = useRef<number | null>(null);

  const {
    isConnected,
    roomState,
    cursors,
    codeCursors,
    error,
    emitCanvasUpdate,
    emitCodeUpdate,
    emitCursorUpdate,
    emitQuestionUpdate,
    emitCodeCursorUpdate,
    // Access control
    accessDenied,
    waitingForApproval,
    wasDenied,
    joinRequests,
    askToJoin,
    respondToJoinRequest,
  } = useLiveRoom(roomId);

  const endRoomMutation = useMutation({
    mutationFn: async () => {
      if (!roomId) throw new Error("No room ID");
      const response = await apiRequest("POST", `/api/rooms/${roomId}/end`, {});
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to end room");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Room ended",
        description: "The room has been closed successfully.",
      });
      navigate("/");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to end room";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Sync question link from room state
  useEffect(() => {
    if (roomState?.questionLink && !isEditingQuestion) {
      setQuestionLinkInput(roomState.questionLink);
    }
  }, [roomState?.questionLink, isEditingQuestion]);

  useEffect(() => {
    if (roomState?.codeLanguage) {
      setSelectedLanguage(roomState.codeLanguage);
    }
  }, [roomState?.codeLanguage]);

  useEffect(() => {
    if (wasDenied) {
      navigate("/");
    }
  }, [wasDenied, navigate]);

  // Apply remote canvas updates (ONLY elements, not appState)
  useEffect(() => {
    if (!roomState || !excalidrawRef.current) return;

    const elements = roomState.canvasData?.elements || [];
    const serialized = JSON.stringify(elements);

    // Skip if elements haven't changed
    if (serialized === lastElementsSnapshotRef.current) return;

    // Mark that we're applying a remote update to prevent feedback loop
    isApplyingRemoteUpdateRef.current = true;
    lastElementsSnapshotRef.current = serialized;

    // Update ONLY elements, preserve local appState (zoom, color, tool, etc.)
    excalidrawRef.current.updateScene({ elements });

    // Reset flag after Excalidraw processes the update
    setTimeout(() => {
      isApplyingRemoteUpdateRef.current = false;
    }, 50);
  }, [roomState?.canvasData?.elements]);

  useEffect(() => {
    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;
    if (!editor || !monacoInstance) return;

    const decorations = Array.from(codeCursors.values())
      .filter((cursor) => cursor.position)
      .map((cursor) => {
        const colors = getCursorColors(cursor.userId);
        let classes = remoteCursorClassMapRef.current.get(cursor.userId);
        if (!classes) {
          const base = sanitizeForClassName(cursor.userId.slice(-8)) || String(cursor.userId.length);
          const caretClass = `remote-caret-${base}`;
          const labelClass = `remote-caret-label-${base}`;
          if (!document.getElementById(`style-${caretClass}`)) {
            const style = document.createElement("style");
            style.id = `style-${caretClass}`;
            style.textContent = `
              .${caretClass} {
                border-left: 2px solid ${colors.stroke};
              }
              .${labelClass} {
                background: ${colors.background};
                color: white;
                padding: 0 4px;
                border-radius: 4px;
                font-size: 11px;
              }
            `;
            document.head.appendChild(style);
          }
          classes = { caretClass, labelClass };
          remoteCursorClassMapRef.current.set(cursor.userId, classes);
        }
        const range = new monacoInstance.Range(
          cursor.position!.lineNumber,
          cursor.position!.column,
          cursor.position!.lineNumber,
          cursor.position!.column
        );
        const stickiness =
          monacoInstance.editor?.TrackedRangeStickiness?.NeverGrowsWhenTypingAtEdges ?? 0;
        return {
          range,
          options: {
            className: classes.caretClass,
            stickiness,
            after: {
              content: ` ${cursor.username ?? "User"}`,
              inlineClassName: classes.labelClass,
            },
          },
        };
      });

    codeCursorDecorationsRef.current = editor.deltaDecorations(
      codeCursorDecorationsRef.current,
      decorations
    );
  }, [codeCursors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear throttle timer
      if (emitThrottleTimerRef.current) {
        clearTimeout(emitThrottleTimerRef.current);
      }
      // Clear editor decorations
      if (editorRef.current) {
        editorRef.current.deltaDecorations(codeCursorDecorationsRef.current, []);
      }
    };
  }, []);

  // Handle Excalidraw changes with throttling
  const handleExcalidrawChange = useCallback(
    (elements: any, appState: any) => {
      if (!isConnected || isApplyingRemoteUpdateRef.current) return;

      const serialized = JSON.stringify(elements);

      // Skip if elements haven't changed
      if (serialized === lastElementsSnapshotRef.current) return;

      lastElementsSnapshotRef.current = serialized;

      // Throttle emissions to max 60fps (16ms) for smooth performance
      if (emitThrottleTimerRef.current) {
        return; // Skip this update, previous one is still pending
      }

      emitThrottleTimerRef.current = window.setTimeout(() => {
        // Only emit elements, NOT appState (keeps color, tool, zoom local)
        emitCanvasUpdate({ elements });
        emitThrottleTimerRef.current = null;
      }, 16);
    },
    [isConnected, emitCanvasUpdate]
  );

  // Handle Monaco editor changes
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!isConnected || value === undefined) return;
      emitCodeUpdate(value, selectedLanguage);
    },
    [isConnected, emitCodeUpdate, selectedLanguage]
  );

  // Handle question link update
  const handleQuestionLinkSave = () => {
    const trimmed = questionLinkInput.trim();
    emitQuestionUpdate(trimmed || null);
    setIsEditingQuestion(false);
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    emitCodeUpdate(undefined, value);
  };

  // Copy invite link
  const handleCopyInvite = async () => {
    if (!roomId || !roomState?.meetLink) return;
    const invite = `Join my CodeVault room: ${window.location.origin}/room/${roomId}?meet=${encodeURIComponent(
      roomState.meetLink
    )}`;
    try {
      await navigator.clipboard.writeText(invite);
      toast({ title: "Invite copied!", description: "Share it with your friends." });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  // Open Meet link
  const handleOpenMeet = () => {
    if (roomState?.meetLink) {
      window.open(roomState.meetLink, "_blank", "noopener,noreferrer");
    } else if (meetLinkFromUrl) {
      window.open(meetLinkFromUrl, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    if (!isCodeEditorOpen) {
      emitCodeCursorUpdate({ position: null });
    }
  }, [isCodeEditorOpen, emitCodeCursorUpdate]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isConnected || !roomState) {
      timeout = setTimeout(() => {
        setShowLoadingTimeout(true);
      }, 10000);
    } else {
      setShowLoadingTimeout(false);
    }
    return () => clearTimeout(timeout);
  }, [isConnected, roomState]);

  if (!roomId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-destructive">Invalid room ID</p>
          <Button className="mt-4" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6 text-center max-w-md">
          <p className="text-destructive font-semibold mb-2">Room Error</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="p-6 text-center max-w-md w-full mx-4">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Waiting Room</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This room requires approval from the host to join.
          </p>
          {waitingForApproval ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium">Waiting for host approval...</p>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
              <Button onClick={askToJoin}>Ask to Join</Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (!isConnected || !roomState) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Connecting to room...</p>
          {showLoadingTimeout && (
            <div className="mt-4">
              <p className="text-xs text-destructive mb-2">Taking longer than expected...</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Exit
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Room #{roomId}</span>
            {isConnected && <Badge variant="outline" className="text-xs">Live</Badge>}
          </div>
          {roomState.createdByName && (
            <span className="text-xs text-muted-foreground">by {roomState.createdByName}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Question Link */}
          {isEditingQuestion ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="https://leetcode.com/problems/..."
                value={questionLinkInput}
                onChange={(e) => setQuestionLinkInput(e.target.value)}
                className="h-8 w-64 text-xs"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleQuestionLinkSave}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditingQuestion(false);
                  setQuestionLinkInput(roomState.questionLink || "");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : roomState.questionLink ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(roomState.questionLink!, "_blank")}
            >
              <Link2 className="h-4 w-4 mr-1" />
              Question
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setIsEditingQuestion(true)}>
              <Link2 className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* Members */}
          <Button
            size="sm"
            variant={isMembersOpen ? "secondary" : "ghost"}
            onClick={() => setIsMembersOpen(!isMembersOpen)}
            title={`View ${roomState.members.length} member${roomState.members.length === 1 ? '' : 's'} in this room`}
          >
            <Users className="h-4 w-4 mr-1" />
            <span className="font-semibold">{roomState.members.length}</span>
            <span className="ml-1 text-xs opacity-70">online</span>
          </Button>

          {/* Invite Friends */}
          <Button size="sm" variant="ghost" onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Invite
          </Button>

          {/* Copy Invite */}
          <Button size="sm" variant="ghost" onClick={handleCopyInvite}>
            <Copy className="h-4 w-4" />
          </Button>

          {/* Join Meet */}
          <Button size="sm" variant="secondary" onClick={handleOpenMeet}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Join Meet
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Toggle Code Editor */}
          <Button
            size="sm"
            variant={isCodeEditorOpen ? "secondary" : "ghost"}
            onClick={() => setIsCodeEditorOpen(!isCodeEditorOpen)}
          >
            <Code2 className="h-4 w-4 mr-1" />
            Code
          </Button>

          {/* End Room */}
          <Button size="sm" variant="destructive" onClick={() => setShowEndDialog(true)}>
            <LogOut className="h-4 w-4 mr-1" />
            End
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative bg-background">
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 relative"
          onLayout={(sizes) => {
            if (isCodeEditorOpen && sizes[1] !== undefined) {
              setCodePanelSize(sizes[1]);
            }
          }}
        >
          <ResizablePanel
            minSize={35}
            defaultSize={isCodeEditorOpen ? 100 - codePanelSize : 100}
            className="relative z-10"
          >
            <div className="relative h-full w-full">
              <Excalidraw
                initialData={{
                  elements: (roomState.canvasData as any)?.elements || [],
                  // DO NOT load appState from server - keeps UI state local
                  appState: {},
                }}
                onChange={handleExcalidrawChange}
                onPointerUpdate={(payload: any) => {
                  if (payload.pointer) {
                    emitCursorUpdate(payload.pointer);
                  }
                }}
                excalidrawAPI={(api) => {
                  excalidrawRef.current = api;
                }}
              >
                <MainMenu>
                  <MainMenu.DefaultItems.ClearCanvas />
                  <MainMenu.DefaultItems.SaveAsImage />
                  <MainMenu.DefaultItems.Export />
                  <MainMenu.DefaultItems.LoadScene />
                  <MainMenu.DefaultItems.Help />
                  <MainMenu.DefaultItems.ToggleTheme />
                </MainMenu>
                <WelcomeScreen>
                  <WelcomeScreen.Hints.MenuHint />
                  <WelcomeScreen.Hints.ToolbarHint />
                </WelcomeScreen>
              </Excalidraw>

              {/* Render other users' cursors */}
              {Array.from(cursors.values()).map((cursor) => {
                if (!cursor.pointer || cursor.pointer.x === null || cursor.pointer.y === null) return null;
                const colors = getCursorColors(cursor.userId);
                return (
                  <motion.div
                    key={cursor.userId}
                    className="pointer-events-none fixed z-[9999]"
                    style={{
                      left: 0,
                      top: 0,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      x: cursor.pointer.x,
                      y: cursor.pointer.y,
                    }}
                    transition={{
                      duration: 0.15,
                      ease: "linear"
                    }}
                  >
                    <div className="relative">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="drop-shadow-lg">
                        <path
                          d="M3 3L3 17L8 12L11 17L13 16L10 11L17 11L3 3Z"
                          fill={colors.background}
                          stroke={colors.stroke}
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div
                        className="absolute top-5 left-5 whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-white shadow-lg"
                        style={{ background: colors.background, border: `1px solid ${colors.stroke}` }}
                      >
                        {cursor.username || "User"}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ResizablePanel>

          {isCodeEditorOpen && (
            <>
              <ResizableHandle withHandle className="bg-border/60 z-20" />
              <ResizablePanel minSize={20} defaultSize={codePanelSize} maxSize={60} className="z-20">
                <div className="flex h-full flex-col border-l bg-card shadow-lg">
                  <div className="flex items-center justify-between border-b px-4 py-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Shared Code</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" onClick={() => setIsCodeEditorOpen(false)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Editor
                      height="100%"
                      language={selectedLanguage}
                      value={roomState.codeData}
                      onChange={handleEditorChange}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        smoothScrolling: true,
                      }}
                      onMount={(editor, monaco) => {
                        editorRef.current = editor;
                        monacoRef.current = monaco;
                        const disposables = [
                          editor.onDidChangeCursorPosition((event: any) => {
                            emitCodeCursorUpdate({
                              position: {
                                lineNumber: event.position.lineNumber,
                                column: event.position.column,
                              },
                              selection: (() => {
                                const selection = editor.getSelection();
                                if (!selection) return null;
                                return {
                                  startLineNumber: selection.startLineNumber,
                                  startColumn: selection.startColumn,
                                  endLineNumber: selection.endLineNumber,
                                  endColumn: selection.endColumn,
                                };
                              })() ?? undefined,
                            });
                          }),
                          editor.onDidBlurEditorWidget(() => {
                            emitCodeCursorUpdate({ position: null });
                          }),
                        ];
                        editor.onDidDispose(() => {
                          disposables.forEach((disposable) => disposable.dispose());
                        });
                      }}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        {/* Members Panel */}
        <AnimatePresence>
          {isMembersOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute left-0 top-0 bottom-0 w-80 border-r bg-card/95 backdrop-blur-sm shadow-2xl z-30"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b px-4 py-3 bg-background/50">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold block">Room Members</span>
                      <span className="text-xs text-muted-foreground">{roomState.members.length} online</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setIsMembersOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                  {roomState.members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                      <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No members yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {roomState.members.map((member, index) => {
                        const colors = getCursorColors(member.userId);
                        return (
                          <div
                            key={member.socketId}
                            className="flex items-center gap-3 rounded-lg border bg-background p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm"
                              style={{
                                backgroundColor: `${colors.background}20`,
                                color: colors.background,
                                border: `2px solid ${colors.background}`
                              }}
                            >
                              {(member.username || "U")[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{member.username || "Anonymous"}</p>
                                {index === 0 && (
                                  <Badge variant="secondary" className="text-xs">Host</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span>Active now</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <div className="border-t p-4 bg-background/50">
                  <p className="text-xs text-muted-foreground text-center">
                    Click the <strong>{roomState.members.length} online</strong> button to toggle this panel
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Invite Friends Dialog */}
      <InviteFriendsDialog
        roomId={roomId}
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />

      {/* End Room Confirmation */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the room for all participants. Canvas and code will be saved, but the
              room will no longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => endRoomMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {endRoomMutation.isPending ? "Ending..." : "End Room"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Join Requests Dialog */}
      <Dialog open={joinRequests.length > 0} onOpenChange={() => { }}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Join Requests</DialogTitle>
            <DialogDescription>
              The following users want to join this room.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {joinRequests.map((req) => (
              <div key={req.socketId} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {(req.username || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{req.username}</p>
                    <p className="text-xs text-muted-foreground">Requesting to join</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => respondToJoinRequest(req.socketId, false)}
                  >
                    Deny
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => respondToJoinRequest(req.socketId, true)}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

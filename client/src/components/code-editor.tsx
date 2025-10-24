import Editor from "@monaco-editor/react";
import { useTheme } from "./theme-provider";
import { Card } from "@/components/ui/card";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = "calc(100vh - 200px)",
}: CodeEditorProps) {
  const { theme } = useTheme();

  return (
    <Card className="h-full overflow-hidden flex flex-col" data-testid="code-editor">
      <Editor
        height={height}
        language={language.toLowerCase()}
        value={value}
        onChange={onChange}
        theme={theme === "dark" ? "vs-dark" : "light"}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "JetBrains Mono, Fira Code, monospace",
          readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          cursorStyle: "line",
          letterSpacing: 0,
          lineHeight: 1.4,
          fontLigatures: true,
          renderWhitespace: "selection",
          wordWrap: "on",
          wrappingIndent: "indent",
        }}
      />
    </Card>
  );
}

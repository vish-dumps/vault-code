import Editor from "@monaco-editor/react";
import { useTheme } from "./theme-provider";
import { Card } from "@/components/ui/card";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  height = "500px",
}: CodeEditorProps) {
  const { theme } = useTheme();

  return (
    <Card className="overflow-hidden" data-testid="code-editor">
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
        }}
      />
    </Card>
  );
}

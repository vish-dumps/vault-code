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

function mapToMonacoLanguage(language?: string) {
  if (!language) return "plaintext";
  const value = language.toLowerCase().trim();
  const directMap: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    kotlin: "kotlin",
    golang: "go",
    go: "go",
    rust: "rust",
    ruby: "ruby",
    php: "php",
    swift: "swift",
    sql: "sql",
    c: "c",
    "c++": "cpp",
    cpp: "cpp",
    csharp: "csharp",
    "c#": "csharp",
    scala: "scala",
    plaintext: "plaintext",
    text: "plaintext",
  };

  if (directMap[value]) {
    return directMap[value];
  }

  if (value.includes("javascript")) return "javascript";
  if (value.includes("typescript")) return "typescript";
  if (value.includes("python")) return "python";
  if (value.includes("c++") || value.includes("cpp")) return "cpp";
  if (value.includes("csharp") || value.includes("c#")) return "csharp";
  if (value.includes("java")) return "java";
  if (value.includes("golang") || value.includes("go")) return "go";
  if (value.includes("rust")) return "rust";
  if (value.includes("swift")) return "swift";
  if (value.includes("kotlin")) return "kotlin";
  if (value.includes("ruby")) return "ruby";
  if (value.includes("php")) return "php";
  if (value.includes("sql")) return "sql";

  return value.replace(/[^a-z0-9]/g, "") || "plaintext";
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
        language={mapToMonacoLanguage(language)}
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

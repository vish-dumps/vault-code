(function () {
  function getMonacoPayload() {
    if (!window.monaco?.editor) {
      return null;
    }

    try {
      const models = window.monaco.editor.getModels();
      if (!models || models.length === 0) {
        return null;
      }

      const model = models[0];
      const code = model.getValue();
      const language = model.getLanguageId?.() || detectLanguageFromEditor();

      return {
        code,
        language: normalizeLanguage(language)
      };
    } catch (error) {
      console.warn("CodeVault injected script: monaco extraction failed", error);
      return null;
    }
  }

  function detectLanguageFromEditor() {
    try {
      const editor = window.monaco.editor.getEditors?.()?.[0];
      return editor?.getModel?.()?.getLanguageId?.() || null;
    } catch {
      return null;
    }
  }

  function normalizeLanguage(language) {
    if (!language) return "Unknown";
    const map = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      python3: "Python",
      java: "Java",
      cpp: "C++",
      "c_cpp": "C++",
      c: "C",
      csharp: "C#",
      golang: "Go",
      go: "Go",
      rust: "Rust",
      swift: "Swift",
      ruby: "Ruby",
      kotlin: "Kotlin",
      plaintext: "Plain Text",
      text: "Plain Text"
    };
    return map[language.toLowerCase()] || language;
  }

  function getAcePayload() {
    if (!window.ace?.edit) {
      return null;
    }

    try {
      const editor = window.ace.edit("program-source-textarea");
      if (!editor) {
        return null;
      }
      return {
        code: editor.getValue(),
        language: normalizeLanguage(editor.session?.getMode?.()?.$id?.split("/").pop())
      };
    } catch (error) {
      console.warn("CodeVault injected script: ace extraction failed", error);
      return null;
    }
  }

  function handleMessage(event) {
    if (event.source !== window) return;
    if (!event.data || event.data.type !== "CODEVAULT_REQUEST_CODE") return;

    const { target, requestId } = event.data;
    let payload = null;

    if (target === "ace") {
      payload = getAcePayload();
    }

    if (!payload) {
      payload = getMonacoPayload();
    }

    if (!payload) {
      payload = {
        code: "",
        language: "Unknown"
      };
    }

    window.postMessage(
      {
        type: "CODEVAULT_RESPONSE_CODE",
        payload,
        requestId
      },
      "*"
    );
  }

  window.addEventListener("message", handleMessage, false);
})();

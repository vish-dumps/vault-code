const DEFAULT_API_BASE = "https://your-codevault-api.com";
const REQUEST_TIMEOUT_MS = 15000;

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get(["apiBaseUrl"]);
  if (!stored.apiBaseUrl) {
    await chrome.storage.sync.set({ apiBaseUrl: DEFAULT_API_BASE });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SAVE_PROBLEM") {
    saveProblem(message.payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) =>
        sendResponse({
          success: false,
          message: error.message || "Failed to save problem."
        })
      );
    return true;
  }

  return false;
});

async function saveProblem(payload) {
  const { apiBaseUrl, authToken, problem } = payload;
  if (!apiBaseUrl) {
    throw new Error("API base URL is missing.");
  }

  const endpoint = new URL("/api/questions", apiBaseUrl).toString();
  const body = buildQuestionPayload(problem);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers = {
    "Content-Type": "application/json"
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (error) {
    throw normalizeError(error);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorBody = await safeParseJson(response);
    const details = errorBody?.error || response.statusText;
    throw new Error(`API responded with ${response.status}: ${details}`);
  }

  return response.json();
}

function buildQuestionPayload(problem) {
  const {
    title,
    platform,
    link,
    code,
    notes,
    tags = [],
    metadata = {}
  } = problem;

  const sanitizedCode = typeof code === "string" ? normalizeCode(code) : "";
  const normalizedPlatform = normalizePlatform(platform, link);
  const normalizedDifficulty = normalizeDifficulty(
    metadata.difficulty,
    normalizedPlatform,
    metadata
  );
  const normalizedTags = Array.from(
    new Set(
      (tags || [])
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter(Boolean)
    )
  );

  const payload = {
    title: title || "Untitled Problem",
    platform: normalizedPlatform,
    link: link || "",
    difficulty: normalizedDifficulty,
    notes: notes || "",
    tags: normalizedTags,
    approaches: []
  };

  if (sanitizedCode) {
    const languageInfo = normalizeLanguage(metadata.language);
    payload.approaches.push({
      name: `${languageInfo.label} Solution`,
      language: languageInfo.value,
      code: sanitizedCode,
      notes: ""
    });
  }

  return payload;
}

function inferPlatformFromLink(link) {
  try {
    const url = new URL(link);
    if (url.hostname.includes("leetcode")) return "LeetCode";
    if (url.hostname.includes("codeforces")) return "CodeForces";
    if (url.hostname.includes("hackerrank")) return "HackerRank";
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

async function safeParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeCode(code) {
  return code.replace(/\u200b/g, "").trimEnd();
}

function normalizeError(error) {
  if (error.name === "AbortError") {
    return new Error("Request timed out. Please try again.");
  }
  return error;
}

function normalizePlatform(platform, link) {
  if (platform) {
    const normalized = resolvePlatform(platform);
    if (normalized !== "Other") return normalized;
  }
  if (link) {
    const inferred = inferPlatformFromLink(link);
    if (inferred !== "Unknown") return inferred;
  }
  return "Other";
}

function resolvePlatform(value) {
  const normalized = value?.toString().toLowerCase() ?? "";
  if (normalized.includes("leetcode")) return "LeetCode";
  if (normalized.includes("codeforces")) return "CodeForces";
  if (normalized.includes("hacker")) return "HackerRank";
  return "Other";
}

function normalizeDifficulty(value, platform, metadata) {
  const cleaned = value?.toString().trim().toLowerCase() ?? "";
  if (cleaned === "easy" || cleaned === "medium" || cleaned === "hard") {
    return capitalize(cleaned);
  }

  const rating = parseInt(cleaned, 10);
  if (!Number.isNaN(rating)) {
    return ratingToDifficulty(rating);
  }

  if (platform === "CodeForces") {
    const ratingFromMeta =
      parseInt(metadata?.difficultyRating, 10) ||
      parseInt(metadata?.rating, 10);
    if (!Number.isNaN(ratingFromMeta)) {
      return ratingToDifficulty(ratingFromMeta);
    }
  }

  return "Medium";
}

function ratingToDifficulty(rating) {
  if (rating < 1200) return "Easy";
  if (rating < 1700) return "Medium";
  return "Hard";
}

function normalizeLanguage(language) {
  const fallback = { value: "python", label: "Python" };
  if (!language) return fallback;

  const raw = language.toString().trim();
  if (!raw) return fallback;

  const value = raw.toLowerCase();

  const map = new Map([
    ["python", { value: "python", label: "Python" }],
    ["python3", { value: "python", label: "Python" }],
    ["py", { value: "python", label: "Python" }],
    ["java", { value: "java", label: "Java" }],
    ["javascript", { value: "javascript", label: "JavaScript" }],
    ["js", { value: "javascript", label: "JavaScript" }],
    ["typescript", { value: "typescript", label: "TypeScript" }],
    ["ts", { value: "typescript", label: "TypeScript" }],
    ["c++", { value: "cpp", label: "C++" }],
    ["cpp", { value: "cpp", label: "C++" }],
    ["c", { value: "cpp", label: "C" }],
    ["go", { value: "go", label: "Go" }],
    ["golang", { value: "go", label: "Go" }]
  ]);

  return map.get(value) ?? fallback;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const DEFAULT_API_BASE = "https://your-codevault-api.com";
const REQUEST_TIMEOUT_MS = 15000;
const AUTO_TRACK_SETTINGS_KEY = "autoTrackSettings";
const AUTO_TRACK_DEFAULTS = {
  enabled: true
};
const SOLVED_CACHE_KEY = "codevault:autoSolvedCache";
const RECENT_SOLVED_KEY = "codevault:recentSolved";
const RECENT_SOLVED_LIMIT = 5;
const CODEFORCES_POLL_INTERVAL_MS = 7000;
const CODEFORCES_MAX_POLLS = 5;
const LEETCODE_CONFIRMATION_WINDOW_MS = 5 * 60 * 1000;
const CODEFORCES_CONFIRMATION_WINDOW_MS = 10 * 60 * 1000;
const AUTO_TRACK_DIFFICULTY_XP = {
  Easy: 50,
  Medium: 80,
  Hard: 120
};

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get(["apiBaseUrl", AUTO_TRACK_SETTINGS_KEY]);
  const updates = {};

  if (!stored.apiBaseUrl) {
    updates.apiBaseUrl = DEFAULT_API_BASE;
  }

  if (!stored[AUTO_TRACK_SETTINGS_KEY]) {
    updates[AUTO_TRACK_SETTINGS_KEY] = { ...AUTO_TRACK_DEFAULTS };
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.sync.set(updates);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.type) {
    return false;
  }

  switch (message.type) {
    case "SAVE_PROBLEM":
      saveProblem(message.payload)
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) =>
          sendResponse({
            success: false,
            message: error?.message || "Failed to save problem."
          })
        );
      return true;

    case "AUTO_TRACK_VERDICT":
      handleAutoTrackDetection(message.payload)
        .then((result) => sendResponse({ success: true, data: result }))
        .catch((error) =>
          sendResponse({
            success: false,
            message: error?.message || "Failed to record solved problem."
          })
        );
      return true;

    case "GET_AUTO_TRACK_STATE":
      getAutoTrackState()
        .then((data) => sendResponse({ success: true, data }))
        .catch((error) =>
          sendResponse({
            success: false,
            message: error?.message || "Failed to load auto-track state."
          })
        );
      return true;

    case "SET_AUTO_TRACK_ENABLED":
      setAutoTrackEnabled(Boolean(message?.payload?.enabled))
        .then((data) => sendResponse({ success: true, data }))
        .catch((error) =>
          sendResponse({
            success: false,
            message: error?.message || "Failed to update auto-track preference."
          })
        );
      return true;

    case "GET_RECENT_SOLVED":
      getRecentSolved()
        .then((list) => sendResponse({ success: true, data: list }))
        .catch((error) =>
          sendResponse({
            success: false,
            message: error?.message || "Failed to load recent solved problems."
          })
        );
      return true;

    default:
      return false;
  }
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

async function handleAutoTrackDetection(payload) {
  if (!payload) {
    throw new Error("Missing auto-tracking payload.");
  }

  const { platform, problemId } = payload;
  if (!platform || !problemId) {
    throw new Error("Missing platform or problem identifier.");
  }

  const settings = await getAutoTrackSettings();
  if (!settings.enabled) {
    return { skipped: true, reason: "auto-track-disabled" };
  }

  const { apiBaseUrl, authToken, user } = await getAuthContext();
  if (!authToken || !user?.id) {
    throw new Error("Sign in to CodeVault in the extension popup to enable auto tracking.");
  }

  const cacheKey = getSolvedCacheKey(platform, problemId);
  if (await isProblemInCache(cacheKey)) {
    return { skipped: true, reason: "already-recorded" };
  }

  let confirmation;
  if (platform === "leetcode") {
    confirmation = await confirmLeetCodeSolve(payload);
  } else if (platform === "codeforces") {
    confirmation = await confirmCodeforcesSolve(payload, user);
  } else {
    throw new Error(`Auto-tracking is not supported for ${platform}.`);
  }

  if (!confirmation) {
    throw new Error("Unable to confirm solved problem.");
  }

  const difficulty = confirmation.difficulty || "Medium";
  const xpAwardedFallback = computeXpForDifficulty(difficulty);

  const requestBody = {
    userId: user.id,
    platform: confirmation.platform,
    title: confirmation.title,
    difficulty,
    tags: confirmation.tags || [],
    link: confirmation.link,
    problemId: confirmation.problemId,
    solvedAt: confirmation.solvedAt,
    metadata: confirmation.metadata || {},
    source: "auto"
  };

  const apiResponse = await postSolvedProblem(apiBaseUrl, authToken, requestBody);
  const xpAwarded = Number.isFinite(apiResponse?.xpAwarded)
    ? apiResponse.xpAwarded
    : xpAwardedFallback;

  await updateSolvedCache(cacheKey, {
    solvedAt: confirmation.solvedAt,
    xpAwarded
  });

  const recentEntry = {
    id: cacheKey,
    title: confirmation.title,
    platform: confirmation.platform,
    difficulty,
    link: confirmation.link,
    solvedAt: confirmation.solvedAt,
    xpAwarded
  };

  const recentSolved = await recordRecentSolved(recentEntry);
  await maybeNotifySolved(recentEntry);

  try {
    await chrome.runtime.sendMessage({
      type: "AUTO_TRACK_SOLVED_RECORDED",
      payload: recentEntry
    });
  } catch {
    // No active listeners; safe to ignore.
  }

  return {
    recorded: true,
    entry: recentEntry,
    recentSolved,
    response: apiResponse
  };
}

async function getAuthContext() {
  const stored = await chrome.storage.sync.get(["apiBaseUrl", "authToken", "userProfile"]);
  return {
    apiBaseUrl: stored.apiBaseUrl || DEFAULT_API_BASE,
    authToken: stored.authToken || null,
    user: stored.userProfile || null
  };
}

async function getAutoTrackState() {
  const settings = await getAutoTrackSettings();
  const recentSolved = await getRecentSolved();
  return {
    enabled: settings.enabled !== false,
    recentSolved
  };
}

async function getAutoTrackSettings() {
  const stored = await chrome.storage.sync.get([AUTO_TRACK_SETTINGS_KEY]);
  const settings = stored[AUTO_TRACK_SETTINGS_KEY];
  if (settings && typeof settings === "object") {
    return {
      ...AUTO_TRACK_DEFAULTS,
      ...settings
    };
  }
  return { ...AUTO_TRACK_DEFAULTS };
}

async function setAutoTrackEnabled(enabled) {
  const next = {
    ...(await getAutoTrackSettings()),
    enabled
  };

  await chrome.storage.sync.set({
    [AUTO_TRACK_SETTINGS_KEY]: next
  });

  return getAutoTrackState();
}

async function getRecentSolved() {
  const stored = await chrome.storage.local.get([RECENT_SOLVED_KEY]);
  const list = stored[RECENT_SOLVED_KEY];
  if (Array.isArray(list)) {
    return list;
  }
  return [];
}

async function recordRecentSolved(entry) {
  const current = await getRecentSolved();
  const deduped = current.filter((item) => item.id !== entry.id);
  const updated = [entry, ...deduped].slice(0, RECENT_SOLVED_LIMIT);
  await chrome.storage.local.set({
    [RECENT_SOLVED_KEY]: updated
  });
  return updated;
}

async function getSolvedCache() {
  const stored = await chrome.storage.local.get([SOLVED_CACHE_KEY]);
  const cache = stored[SOLVED_CACHE_KEY];
  if (cache && typeof cache === "object") {
    return cache;
  }
  return {};
}

async function updateSolvedCache(key, entry) {
  const cache = await getSolvedCache();
  const next = {
    ...cache,
    [key]: entry
  };
  const pruned = pruneSolvedCache(next);
  await chrome.storage.local.set({
    [SOLVED_CACHE_KEY]: pruned
  });
}

async function isProblemInCache(key) {
  const cache = await getSolvedCache();
  return Boolean(cache[key]);
}

function pruneSolvedCache(cache) {
  const entries = Object.entries(cache)
    .sort(([, a], [, b]) => {
      const timeA = a?.solvedAt ? new Date(a.solvedAt).getTime() : 0;
      const timeB = b?.solvedAt ? new Date(b.solvedAt).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 200);
  return Object.fromEntries(entries);
}

function getSolvedCacheKey(platform, problemId) {
  const normalizedPlatform = platform.toString().toLowerCase();
  return `${normalizedPlatform}:${problemId.toString().toLowerCase()}`;
}

function computeXpForDifficulty(difficulty) {
  const normalized = difficulty?.toString().toLowerCase() ?? "medium";
  if (normalized === "easy") return AUTO_TRACK_DIFFICULTY_XP.Easy;
  if (normalized === "hard") return AUTO_TRACK_DIFFICULTY_XP.Hard;
  return AUTO_TRACK_DIFFICULTY_XP.Medium;
}

async function maybeNotifySolved(entry) {
  if (!entry?.title) return;

  const xp = Number(entry.xpAwarded);
  const message = buildNotificationMessage(entry.title, entry.platform, xp);

  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: "CodeVault",
      message
    });
  } catch {
    // Notifications may be disabled; ignore errors.
  }
}

function buildNotificationMessage(title, platform, xp) {
  const base = `🎉 "${title}" added to your solved list`;
  const suffix = Number.isFinite(xp) ? ` (+${xp} XP)` : "";
  const source = platform ? ` • ${capitalize(platform)}` : "";
  return `${base}${suffix}${source}`;
}

async function confirmLeetCodeSolve(payload) {
  const slug = (payload.metadata?.slug || payload.problemId || "").toLowerCase();
  if (!slug) {
    throw new Error("Unable to detect LeetCode problem slug.");
  }

  const maxAttempts = 6;
  let attempt = 0;
  let submission = null;
  const detectionTime = typeof payload.detectedAt === "number" ? payload.detectedAt : Date.now();

  while (attempt < maxAttempts && Date.now() - detectionTime < LEETCODE_CONFIRMATION_WINDOW_MS) {
    const submissions = await fetchLeetCodeLatestSubmission(slug);
    submission = findMatchingLeetCodeSubmission(submissions, detectionTime);
    if (submission) {
      break;
    }
    attempt += 1;
    await delay(1500 + attempt * 400);
  }

  if (!submission) {
    throw new Error("Awaiting LeetCode verdict...");
  }

  const metadata = await fetchLeetCodeQuestionDetails(slug, payload.fallback);
  const solvedAt = Number.isFinite(Number(submission?.timestamp))
    ? new Date(Number(submission.timestamp) * 1000).toISOString()
    : new Date().toISOString();

  return {
    platform: "leetcode",
    title: metadata.title || payload?.fallback?.title || slug,
    difficulty: metadata.difficulty || payload?.fallback?.difficulty || "Medium",
    tags: metadata.tags?.length ? metadata.tags : payload?.fallback?.tags || [],
    link: metadata.link || payload.link || `https://leetcode.com/problems/${slug}/`,
    problemId: slug,
    solvedAt,
    metadata: {
      slug,
      questionId: metadata.questionId ?? null,
      submissionId: submission?.id ?? null,
      language: submission?.lang ?? submission?.programming_language ?? null
    }
  };
}

async function fetchLeetCodeLatestSubmission(slug) {
  const response = await fetch(`https://leetcode.com/api/submissions/${slug}/`, {
    method: "GET",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to fetch LeetCode submissions.");
  }

  const body = await response.json();
  return body?.submissions_dump || [];
}

function findMatchingLeetCodeSubmission(submissions, detectedAt) {
  if (!Array.isArray(submissions)) return null;
  const detectedSeconds = Math.floor((detectedAt || Date.now()) / 1000);

  for (const submission of submissions) {
    const status = submission?.status_display || submission?.statusDisplay || "";
    if (!/accepted/i.test(status)) continue;

    const timestamp = Number(submission?.timestamp);
    if (Number.isFinite(timestamp)) {
      // Accept submissions within a reasonable window around detection.
      if (timestamp + 300 < detectedSeconds) continue;
    }

    return submission;
  }

  return null;
}

async function fetchLeetCodeQuestionDetails(slug, fallback = {}) {
  const csrf = await getCookieValue("https://leetcode.com/", "csrftoken");
  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "x-csrftoken": csrf } : {}),
        Referer: `https://leetcode.com/problems/${slug}/`
      },
      body: JSON.stringify({
        query: `query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            difficulty
            topicTags {
              name
              slug
            }
          }
        }`,
        variables: { titleSlug: slug }
      })
    });

    if (!response.ok) {
      throw new Error("GraphQL request failed");
    }

    const body = await response.json();
    const question = body?.data?.question;

    if (question) {
      return {
        title: question.title,
        difficulty: question.difficulty,
        tags: (question.topicTags || [])
          .map((tag) => tag?.name || tag?.slug)
          .filter(Boolean),
        questionId: question.questionId,
        link: `https://leetcode.com/problems/${slug}/`
      };
    }
  } catch (error) {
    console.debug("LeetCode metadata fetch failed:", error?.message || error);
  }

  return {
    title: fallback.title || slug,
    difficulty: fallback.difficulty || "Medium",
    tags: fallback.tags || [],
    questionId: fallback.questionId ?? null,
    link: fallback.link || `https://leetcode.com/problems/${slug}/`
  };
}

async function getCookieValue(url, name) {
  try {
    const cookie = await chrome.cookies.get({ url, name });
    return cookie?.value || null;
  } catch {
    return null;
  }
}

async function confirmCodeforcesSolve(payload, user) {
  const meta = payload.metadata || {};
  const contestId = meta.contestId || meta.contestIdentifier || payload.contestId;
  const index = meta.index || meta.problemIndex || payload.problemIndex;
  const link = payload.link;

  if (!contestId || !index) {
    throw new Error("Unable to resolve Codeforces problem identity.");
  }

  const handle =
    meta.handle ||
    meta.detectedHandle ||
    user?.codeforcesUsername ||
    user?.codeforcesHandle;

  if (!handle) {
    throw new Error("Add your Codeforces handle in CodeVault to auto-track solves.");
  }

  const normalizedIndex = index.toString().toUpperCase();
  const detectionTime = typeof payload.detectedAt === "number" ? payload.detectedAt : Date.now();
  const detectionDeadline = detectionTime + CODEFORCES_CONFIRMATION_WINDOW_MS;
  let attempt = 0;
  let match = null;

  while (attempt < CODEFORCES_MAX_POLLS && Date.now() < detectionDeadline) {
    const submissions = await fetchCodeforcesUserStatus(handle);
    match = findMatchingCodeforcesSubmission(
      submissions,
      Number(contestId),
      normalizedIndex,
      detectionTime
    );

    if (match) {
      break;
    }

    attempt += 1;
    await delay(CODEFORCES_POLL_INTERVAL_MS);
  }

  if (!match) {
    throw new Error("Awaiting Codeforces verdict...");
  }

  const rating = match.problem?.rating ?? meta.rating ?? null;
  const difficulty = rating ? mapRatingToDifficulty(rating) : (payload?.fallback?.difficulty || "Medium");
  const tags = match.problem?.tags?.length ? match.problem.tags : payload?.fallback?.tags || [];
  const solvedAt = new Date(match.creationTimeSeconds * 1000).toISOString();

  return {
    platform: "codeforces",
    title: match.problem?.name || payload?.fallback?.title || `${contestId}-${normalizedIndex}`,
    difficulty,
    tags,
    link: link || `https://codeforces.com/contest/${contestId}/problem/${normalizedIndex}`,
    problemId: `${contestId}-${normalizedIndex}`.toLowerCase(),
    solvedAt,
    metadata: {
      contestId: Number(contestId),
      index: normalizedIndex,
      handle,
      rating,
      submissionId: match?.id ?? match?.submissionId ?? null,
      language: match?.programmingLanguage ?? null,
      verdict: match?.verdict ?? "OK"
    }
  };
}

async function fetchCodeforcesUserStatus(handle) {
  const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=25`;
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error("Failed to fetch Codeforces submissions.");
  }

  const body = await response.json();
  if (body?.status !== "OK") {
    throw new Error(body?.comment || "Codeforces API error.");
  }

  return body?.result || [];
}

function findMatchingCodeforcesSubmission(submissions, contestId, index, detectedAt) {
  if (!Array.isArray(submissions)) return null;
  const detectionSeconds = Math.floor((detectedAt || Date.now()) / 1000);

  for (const submission of submissions) {
    if (!submission || submission.verdict !== "OK") continue;

    const problem = submission.problem || {};
    if (Number(problem.contestId) !== Number(contestId)) continue;
    if (problem.index?.toUpperCase() !== index.toUpperCase()) continue;

    const timestamp = Number(submission.creationTimeSeconds);
    if (Number.isFinite(timestamp)) {
      if (timestamp + 600 < detectionSeconds) continue;
    }

    return submission;
  }

  return null;
}

function mapRatingToDifficulty(rating) {
  if (!Number.isFinite(Number(rating))) return "Medium";
  return ratingToDifficulty(Number(rating));
}

async function postSolvedProblem(apiBaseUrl, authToken, body) {
  const endpoint = new URL("/api/user/solved", apiBaseUrl).toString();
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
    const details = errorBody?.error || errorBody?.message || response.statusText;
    throw new Error(`API responded with ${response.status}: ${details}`);
  }

  return response.json();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

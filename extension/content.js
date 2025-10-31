const SCRAPERS = {
  "leetcode.com": scrapeLeetCode,
  "www.leetcode.com": scrapeLeetCode,
  "codeforces.com": scrapeCodeforces,
  "www.codeforces.com": scrapeCodeforces
};

const AUTO_TRACK_BOOTSTRAP_DELAY_MS = 2500;
const AUTO_TRACK_MIN_INTERVAL_MS = 5000;
const RECENT_DETECTION_LIMIT = 50;
const AUTO_TRACK_VERDICTS = {
  leetcode: ["accepted", "all test cases passed"],
  codeforces: ["accepted", "ok"]
};
const CODEFORCES_STATUS_TABLE_SELECTOR = ".status-frame-datatable tbody";

let bridgeInjected = false;
let autoTrackInitialized = false;
const recentAutoDetections = new Map();

injectBridge();
initAutoSolveDetection();

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.type !== "REQUEST_PROBLEM_DATA") {
    return;
  }

  (async () => {
    try {
      const hostname = window.location.hostname.toLowerCase();
      const scraper = SCRAPERS[hostname];

      if (!scraper) {
        sendResponse({
          success: false,
          message: "Unsupported site."
        });
        return;
      }

      const data = await scraper();

      if (!data?.title && !data?.code) {
        sendResponse({
          success: false,
          message: "No problem detected on this page."
        });
        return;
      }

      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({
        success: false,
        message: error?.message || "Failed to parse this page."
      });
    }
  })();

  return true;
});

async function scrapeLeetCode() {
  const link = window.location.href;
  const result = {
    platform: "LeetCode",
    link,
    title: "",
    code: "",
    tags: [],
    notes: "",
    metadata: {}
  };

  const questionData = extractLeetCodeQuestionData();

  if (questionData) {
    result.title = questionData.title || "";
    result.metadata.difficulty = questionData.difficulty || "Unknown";
    result.metadata.displayDifficulty = questionData.difficulty || "Unknown";
    const tagNames = (questionData.topicTags || [])
      .map((tag) => tag.name || tag.slug || "")
      .filter(Boolean);
    result.tags = uniqueStrings(tagNames);
  }

  if (!result.title) {
    const titleNode =
      document.querySelector("[data-cy='question-title']") ||
      document.querySelector("div.text-title-large") ||
      document.querySelector("h1");
    result.title = titleNode?.textContent?.trim() || "";
  }

  const editorPayload = await requestEditorPayload();
  result.code = editorPayload.code || extractLeetCodeDomCode();
  result.metadata.language = editorPayload.language || detectLeetCodeLanguage();

  if (!result.metadata.difficulty) {
    result.metadata.difficulty = detectLeetCodeDifficulty();
  }

  const domTags = extractTextFromElements("a[href*='/tag/']");
  result.tags = uniqueStrings([...result.tags, ...domTags]);

  return result;
}

async function scrapeCodeforces() {
  const link = window.location.href;
  const result = {
    platform: "Codeforces",
    link,
    title: "",
    code: "",
    tags: [],
    notes: "",
    metadata: {}
  };

  const difficultyInfo = extractCodeforcesDifficulty();
  result.metadata.difficulty = difficultyInfo.raw || "Unknown";
  result.metadata.difficultyRating = difficultyInfo.rating ?? null;
  result.metadata.displayDifficulty = difficultyInfo.display || "Unknown";

  const titleNode = document.querySelector(".problem-statement .title");
  result.title = titleNode?.textContent?.replace(/^[\s\d.]+/, "").trim() || "";

  const editorPayload = await requestEditorPayload("ace");
  if (editorPayload.code) {
    result.code = editorPayload.code;
    result.metadata.language = editorPayload.language;
  } else {
    const textarea = document.getElementById("program-source-textarea");
    result.code = textarea?.value || "";
    result.metadata.language = detectCodeforcesLanguage();
  }

  const domTags = extractTextFromElements(
    ".sidebox .tag-box, .tag-box a, .tag-box span"
  );
  const scriptTags = extractCodeforcesTagsFromScripts();
  result.tags = uniqueStrings([...domTags, ...scriptTags]);

  return result;
}

function injectBridge() {
  if (bridgeInjected) return;
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.async = false;
  script.onload = () => script.remove();
  document.documentElement.appendChild(script);
  bridgeInjected = true;
}

function extractLeetCodeQuestionData() {
  const nextData = window.__NEXT_DATA__;
  if (!nextData?.props?.pageProps) return null;

  const pageProps = nextData.props.pageProps;
  if (pageProps.questionData) {
    return pageProps.questionData;
  }

  const queries = pageProps.dehydratedState?.queries;
  if (Array.isArray(queries)) {
    for (const query of queries) {
      const question = query?.state?.data?.question;
      if (question?.title) {
        return question;
      }
    }
  }

  return findNestedQuestion(pageProps);
}

function findNestedQuestion(value, depth = 0) {
  if (!value || depth > 6) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNestedQuestion(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === "object") {
    if (value.title && value.topicTags) return value;
    for (const key of Object.keys(value)) {
      const found = findNestedQuestion(value[key], depth + 1);
      if (found) return found;
    }
  }

  return null;
}

async function requestEditorPayload(target) {
  return new Promise((resolve) => {
    const requestId = `codevault-${Date.now()}-${Math.random()}`;
    const timeout = setTimeout(() => {
      window.removeEventListener("message", listener);
      resolve({ code: "", language: "Unknown" });
    }, 1200);

    function listener(event) {
      if (event.source !== window) return;
      if (!event.data || event.data.type !== "CODEVAULT_RESPONSE_CODE") return;
      if (event.data.requestId !== requestId) return;

      clearTimeout(timeout);
      window.removeEventListener("message", listener);
      resolve(event.data.payload || { code: "", language: "Unknown" });
    }

    window.addEventListener("message", listener);
    window.postMessage(
      { type: "CODEVAULT_REQUEST_CODE", target, requestId },
      "*"
    );
  });
}

function extractLeetCodeDomCode() {
  const textarea = document.querySelector(".monaco-editor textarea");
  if (textarea?.value) {
    return textarea.value;
  }

  const codeBlocks = document.querySelectorAll(
    "pre:not([role='presentation']) code"
  );
  if (codeBlocks.length > 0) {
    return Array.from(codeBlocks)
      .map((block) => block.textContent || "")
      .join("\n");
  }

  return "";
}

function detectLeetCodeLanguage() {
  const selectorButton = document.querySelector("[data-cy='lang-select-button']");
  if (selectorButton?.textContent) {
    return selectorButton.textContent.trim();
  }

  const languageNode = document.querySelector(".ant-select-selection-item");
  if (languageNode?.textContent) {
    return languageNode.textContent.trim();
  }

  return "Unknown";
}

function detectLeetCodeDifficulty() {
  const badge = document.querySelector(
    "[diff], span.text-difficulty, span.difficulty"
  );
  if (!badge?.textContent) return "Unknown";
  return badge.textContent.replace(/Difficulty\s*:?/, "").trim();
}

function extractCodeforcesDifficulty() {
  const difficultyTag = document.querySelector(".tag-box span.problem-rating");
  const text = difficultyTag?.textContent?.trim() || "";
  const rating = parseInt(text, 10);

  if (Number.isNaN(rating)) {
    return {
      raw: text || "Unknown",
      rating: null,
      display: text || "Unknown"
    };
  }

  return {
    raw: String(rating),
    rating,
    display: `${rating} (~${ratingToDifficulty(rating)})`
  };
}

function detectCodeforcesLanguage() {
  const select = document.querySelector("select[name='programTypeId']");
  const selection = select?.options[select.selectedIndex];
  return selection?.textContent?.trim() || "Unknown";
}

function extractTextFromElements(selector) {
  const nodes = document.querySelectorAll(selector);
  return Array.from(nodes)
    .map((node) => node.textContent?.trim())
    .filter(Boolean);
}

function extractCodeforcesTagsFromScripts() {
  const tags = [];
  const scripts = document.querySelectorAll("script");
  for (const script of scripts) {
    const text = script.textContent;
    if (!text || !text.includes("problemTags")) continue;

    const match = text.match(/problemTags\s*=\s*\[([^\]]*)\]/);
    if (!match) continue;

    const rawList = match[1];
    const parsed = rawList
      .split(",")
      .map((item) =>
        item
          .trim()
          .replace(/^['"]/, "")
          .replace(/['"]$/, "")
      )
      .filter(Boolean);

    tags.push(...parsed);
    break;
  }
  return tags;
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function ratingToDifficulty(rating) {
  if (rating < 1200) return "Easy";
  if (rating < 1700) return "Medium";
  return "Hard";
}

function initAutoSolveDetection() {
  if (autoTrackInitialized) return;
  autoTrackInitialized = true;

  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes("leetcode.com")) {
    setupLeetCodeAutoTracker();
  }
  if (hostname.includes("codeforces.com")) {
    setupCodeforcesAutoTracker();
  }
}

function setupLeetCodeAutoTracker() {
  const start = Date.now();

  const observer = new MutationObserver((mutations) => {
    if (Date.now() - start < AUTO_TRACK_BOOTSTRAP_DELAY_MS) return;

    const verdictDetected = mutations.some((mutation) =>
      mutationSignalsVerdict(mutation, AUTO_TRACK_VERDICTS.leetcode)
    );

    if (verdictDetected) {
      triggerLeetCodeDetection();
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
  } else {
    window.addEventListener(
      "DOMContentLoaded",
      () =>
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true
        }),
      { once: true }
    );
  }
}

function setupCodeforcesAutoTracker() {
  const start = Date.now();

  const observer = new MutationObserver((mutations) => {
    if (Date.now() - start < AUTO_TRACK_BOOTSTRAP_DELAY_MS) return;

    const verdictDetected = mutations.some((mutation) =>
      mutationSignalsVerdict(mutation, AUTO_TRACK_VERDICTS.codeforces)
    );

    if (verdictDetected) {
      triggerCodeforcesDetection();
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
  } else {
    window.addEventListener(
      "DOMContentLoaded",
      () =>
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true
        }),
      { once: true }
    );
  }
}

function triggerLeetCodeDetection() {
  const slug = getLeetCodeSlug(window.location.href);
  if (!slug) return;

  const key = `leetcode:${slug}`;
  if (!registerAutoDetection(key)) return;

  const questionData = extractLeetCodeQuestionData();
  const fallback = buildLeetCodeFallback(questionData);

  const payload = {
    platform: "leetcode",
    problemId: slug,
    link: window.location.href.split("#")[0],
    detectedAt: Date.now(),
    metadata: {
      slug,
      questionId: questionData?.questionId ?? null
    },
    fallback
  };

  safeSendAutoTrackMessage(payload);
}

function triggerCodeforcesDetection() {
  const statusMetadata = extractCodeforcesStatusSolve();
  const pageMetadata = extractCodeforcesAutoMetadata();
  const metadata = statusMetadata ?? pageMetadata;
  if (!metadata) return;

  const detectionKey = statusMetadata?.submissionId
    ? `codeforces:submission:${statusMetadata.submissionId}`
    : `codeforces:${metadata.problemKey}`;
  if (!registerAutoDetection(detectionKey)) return;

  const payload = {
    platform: "codeforces",
    problemId: metadata.problemKey,
    link: metadata.link,
    detectedAt: Date.now(),
    metadata: {
      contestId: metadata.contestId,
      index: metadata.index,
      handle: statusMetadata?.handle || metadata.handle,
      rating: metadata.rating,
      submissionId: statusMetadata?.submissionId ?? null
    },
    fallback: {
      title: metadata.title,
      tags: metadata.tags,
      difficulty: metadata.difficulty,
      rating: metadata.rating
    }
  };

  safeSendAutoTrackMessage(payload);
}

function registerAutoDetection(key) {
  const now = Date.now();
  const last = recentAutoDetections.get(key) || 0;
  if (now - last < AUTO_TRACK_MIN_INTERVAL_MS) {
    return false;
  }

  recentAutoDetections.set(key, now);

  if (recentAutoDetections.size > RECENT_DETECTION_LIMIT) {
    const sorted = Array.from(recentAutoDetections.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, RECENT_DETECTION_LIMIT);

    recentAutoDetections.clear();
    for (const [itemKey, timestamp] of sorted) {
      recentAutoDetections.set(itemKey, timestamp);
    }
  }

  return true;
}

function nodesContainVerdict(nodes, keywords) {
  if (!nodes || typeof nodes[Symbol.iterator] !== "function") return false;
  for (const node of nodes) {
    if (nodeContainsVerdict(node, keywords)) {
      return true;
    }
  }
  return false;
}

function nodeContainsVerdict(node, keywords) {
  if (!node) return false;

  if (node.nodeType === Node.TEXT_NODE) {
    return textIncludesVerdict(node.textContent, keywords);
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    if (textIncludesVerdict(node.textContent, keywords) && nodeMatchesVerdictContext(node)) {
      return true;
    }

    for (const child of node.childNodes) {
      if (nodeContainsVerdict(child, keywords)) {
        return true;
      }
    }
  }

  return false;
}

function textIncludesVerdict(text, keywords) {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return keywords.some((word) => normalized.includes(word));
}

function nodeMatchesVerdictContext(node) {
  if (!(node instanceof HTMLElement)) return false;

  const className = node.className ? node.className.toString().toLowerCase() : "";
  if (className.includes("verdict") || className.includes("accepted") || className.includes("success")) {
    return true;
  }

  if (
    node.dataset?.e2eLcSubmissionResult ||
    node.dataset?.e2eSubmissionResult ||
    node.dataset?.status ||
    node.dataset?.result
  ) {
    return true;
  }

  return Boolean(
    node.closest(
      "[data-e2e-lc-submission-result], [data-e2e-submission-result], [role='status'], .status, .result, .verdict, .feedback, .success"
    )
  );
}

function getLeetCodeSlug(url) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/problems\/([^/]+)\//);
    if (match) {
      return match[1].toLowerCase();
    }
  } catch {
    return null;
  }
  return null;
}

function buildLeetCodeFallback(questionData) {
  const title =
    questionData?.title ||
    document.querySelector("[data-cy='question-title']")?.textContent?.trim() ||
    document.querySelector("div.text-title-large")?.textContent?.trim() ||
    document.querySelector("h1")?.textContent?.trim() ||
    "";

  const difficulty = questionData?.difficulty || detectLeetCodeDifficulty() || "Medium";
  const tags = uniqueStrings(
    [
      ...(questionData?.topicTags?.map((tag) => tag?.name || tag?.slug) || []),
      ...extractTextFromElements("a[href*='/tag/']")
    ].filter(Boolean)
  );

  return {
    title,
    difficulty,
    tags
  };
}

function extractCodeforcesAutoMetadata() {
  const urlInfo = parseCodeforcesUrlDetails(window.location.href);
  if (!urlInfo) return null;

  const titleNode = document.querySelector(".problem-statement .title");
  const title = titleNode?.textContent?.replace(/^[\s\d.]+/, "").trim() || `${urlInfo.index}`;
  const difficultyInfo = extractCodeforcesDifficulty();
  const tags = uniqueStrings([
    ...extractTextFromElements(".sidebox .tag-box, .tag-box a, .tag-box span"),
    ...extractCodeforcesTagsFromScripts()
  ]);

  return {
    contestId: urlInfo.contestId,
    index: urlInfo.index,
    problemKey: `${urlInfo.contestId}-${urlInfo.index}`.toLowerCase(),
    link: urlInfo.link,
    title,
    rating: difficultyInfo.rating ?? null,
    difficulty: difficultyInfo.display || difficultyInfo.raw || null,
    tags,
    handle: detectCodeforcesHandle()
  };
}

function parseCodeforcesUrlDetails(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);

    let contestId = null;
    let index = null;

    if (parts[0] === "problemset" && parts[1] === "problem" && parts.length >= 4) {
      contestId = parts[2];
      index = parts[3];
    } else {
      const contestIdx = parts.indexOf("contest");
      const gymIdx = parts.indexOf("gym");
      const baseIdx = contestIdx !== -1 ? contestIdx : gymIdx;
      if (baseIdx !== -1 && parts.length > baseIdx + 2) {
        contestId = parts[baseIdx + 1];
        const problemIdx = parts.indexOf("problem", baseIdx);
        if (problemIdx !== -1 && parts.length > problemIdx + 1) {
          index = parts[problemIdx + 1];
        }
      }
    }

    if (!contestId || !index) {
      const params = parsed.searchParams;
      contestId = contestId || params.get("contestId") || params.get("gymId");
      index = index || params.get("problemIndex") || params.get("index");
    }

    if (!contestId || !index) {
      return null;
    }

    return {
      contestId: contestId.toString(),
      index: index.toString().toUpperCase(),
      link: parsed.href
    };
  } catch {
    return null;
  }
}

function detectCodeforcesHandle() {
  const selectors = [
    "#header a[href^='/profile/']",
    ".userbox .info a[href^='/profile/']",
    ".lang-chooser ~ a[href^='/profile/']",
    "a[href^='/profile/']"
  ];

  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const text = node?.textContent?.trim();
    if (text) {
      return text;
    }
  }

  return null;
}

function safeSendAutoTrackMessage(payload) {
  try {
    chrome.runtime.sendMessage(
      {
        type: "AUTO_TRACK_VERDICT",
        payload
      },
      (response) => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.debug("CodeVault auto-track error:", error.message);
          return;
        }
        if (response && response.success === false) {
          console.debug("CodeVault auto-track skipped:", response.message);
        }
      }
    );
  } catch (error) {
    console.debug("CodeVault auto-track failed:", error?.message || error);
  }
}

function mutationSignalsVerdict(mutation, keywords) {
  if (!mutation) return false;

  if (mutation.type === "childList" && mutation.addedNodes?.length) {
    if (nodesContainVerdict(mutation.addedNodes, keywords)) {
      return true;
    }
  }

  if (mutation.type === "characterData") {
    const target = mutation.target;
    if (textIncludesVerdict(target?.textContent, keywords)) {
      return true;
    }
    if (target?.parentNode && nodeContainsVerdict(target.parentNode, keywords)) {
      return true;
    }
  }

  if (mutation.type === "attributes") {
    const target = mutation.target;
    if (target && nodeContainsVerdict(target, keywords)) {
      return true;
    }
  }

  return false;
}

function extractCodeforcesStatusSolve() {
  const table = document.querySelector(CODEFORCES_STATUS_TABLE_SELECTOR);
  if (!table) return null;

  const rows = Array.from(table.querySelectorAll("tr")).map((row) => {
    const submissionIdAttr =
      row.getAttribute("data-submission-id") ||
      row.id ||
      row.querySelector("td:first-child a")?.textContent ||
      row.querySelector("td:first-child")?.textContent ||
      "";
    const submissionId = Number.parseInt(submissionIdAttr.toString().trim(), 10);
    return { row, submissionId: Number.isFinite(submissionId) ? submissionId : -Infinity };
  });

  rows.sort((a, b) => b.submissionId - a.submissionId);

  for (const entry of rows) {
    const { row, submissionId } = entry;
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length < 6) continue;

    const verdictCell = cells[5];
    const verdictText = verdictCell?.textContent?.toLowerCase() ?? "";
    if (!verdictText) continue;

    const isAccepted =
      verdictText.includes("accepted") ||
      verdictText.includes("ok") ||
      verdictCell.querySelector(".verdict-accepted, .verdict-ok");

    if (!isAccepted) continue;

    const problemLink = row.querySelector("td a[href*='/problem/']");
    if (!problemLink) continue;

    const href = problemLink.getAttribute("href") || "";
    const parsed = parseCodeforcesProblemFromHref(href);
    if (!parsed) continue;

    const link = buildAbsoluteUrl(href);
    const handleLink = row.querySelector("td:nth-child(3) a[href^='/profile/']");
    const handleText = handleLink?.textContent?.trim() || detectCodeforcesHandle();

    return {
      contestId: parsed.contestId,
      index: parsed.index,
      problemKey: `${parsed.contestId}-${parsed.index}`.toLowerCase(),
      link,
      title: problemLink.textContent?.trim() || parsed.index,
      handle: handleText || null,
      detectedAt: Date.now(),
      submissionId: Number.isFinite(submissionId) ? submissionId : null
    };
  }

  return null;
}

function parseCodeforcesProblemFromHref(href) {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.origin);
    const parts = url.pathname.split("/").filter(Boolean);
    const contestIdx = parts.indexOf("contest");
    const gymIdx = parts.indexOf("gym");
    const baseIdx = contestIdx !== -1 ? contestIdx : gymIdx;
    if (baseIdx === -1) return null;

    const contestId = parts[baseIdx + 1];
    const problemIdx = parts.indexOf("problem", baseIdx);
    const index = problemIdx !== -1 ? parts[problemIdx + 1] : null;

    if (!contestId || !index) return null;

    return {
      contestId: contestId.toString(),
      index: index.toString().toUpperCase()
    };
  } catch {
    return null;
  }
}

function buildAbsoluteUrl(href) {
  try {
    return new URL(href, window.location.origin).toString();
  } catch {
    return href;
  }
}

const SCRAPERS = {
  "leetcode.com": scrapeLeetCode,
  "www.leetcode.com": scrapeLeetCode,
  "codeforces.com": scrapeCodeforces,
  "www.codeforces.com": scrapeCodeforces
};

let bridgeInjected = false;

injectBridge();

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

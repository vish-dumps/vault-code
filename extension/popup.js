const DEFAULT_API_BASE = "https://your-codevault-api.com";

const RECENT_SOLVED_LIMIT = 5;
const THEME_STORAGE_KEY = "popupTheme";
const THEME_DARK = "dark";
const THEME_LIGHT = "light";

const elements = {
  title: document.getElementById("problem-title"),
  platform: document.getElementById("platform"),
  difficulty: document.getElementById("problem-difficulty"),
  difficultyOverride: document.getElementById("difficulty-override"),
  difficultyHint: document.getElementById("difficulty-hint"),
  tags: document.getElementById("problem-tags"),
  notes: document.getElementById("problem-notes"),
  code: document.getElementById("problem-code"),
  saveButton: document.getElementById("save-problem"),
  saveSpinner: document.querySelector("#save-problem .spinner"),
  saveLabel: document.querySelector("#save-problem .label"),
  saveCheckmark: document.querySelector("#save-problem .checkmark"),
  banner: document.getElementById("status-banner"),
  apiBase: document.getElementById("api-base-url"),
  saveSettings: document.getElementById("save-settings"),
  clearSettings: document.getElementById("clear-settings"),
  refreshProblem: document.getElementById("refresh-problem"),
  loadingCard: document.getElementById("loading-card"),
  authSection: document.getElementById("auth-section"),
  mainSection: document.getElementById("main-section"),
  importFromTab: document.getElementById("import-from-tab"),
  logoutButton: document.getElementById("logout-button"),
  openAppButton: document.getElementById("open-app"),
  userName: document.getElementById("user-name"),
  userEmail: document.getElementById("user-email"),
  userAvatar: document.getElementById("user-avatar"),
  themeToggle: document.getElementById("theme-toggle"),
  autoTrackToggle: document.getElementById("auto-track-toggle"),
  autoTrackStatus: document.getElementById("auto-track-status"),
  lastSolvedList: document.getElementById("last-solved-list")
};

const state = {
  apiBaseUrl: DEFAULT_API_BASE,
  authToken: null,
  user: null,
  lastScrapedData: null,
  currentTabId: null,
  autoTrackEnabled: true,
  recentSolved: [],
  theme: THEME_DARK
};

document.addEventListener("DOMContentLoaded", init);
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "AUTO_TRACK_SOLVED_RECORDED" || !message.payload) {
    return;
  }

  const entry = message.payload;
  state.recentSolved = [
    entry,
    ...state.recentSolved.filter((item) => item.id !== entry.id)
  ].slice(0, RECENT_SOLVED_LIMIT);

  renderRecentSolved(state.recentSolved);
  updateAutoTrackStatus(state.autoTrackEnabled, state.recentSolved);
});

async function init() {
  wireEventHandlers();
  await loadSettings();
  await ensureAuthentication();
}

function wireEventHandlers() {
  elements.saveButton?.addEventListener("click", handleSaveProblem);
  elements.refreshProblem?.addEventListener("click", hydrateFromActiveTab);
  elements.saveSettings?.addEventListener("click", handleSaveSettings);
  elements.clearSettings?.addEventListener("click", handleClearSettings);
  elements.importFromTab?.addEventListener("click", handleImportFromTab);
  elements.logoutButton?.addEventListener("click", handleLogout);
  elements.openAppButton?.addEventListener("click", handleOpenApp);
  elements.themeToggle?.addEventListener("click", handleThemeToggle);
  elements.difficultyOverride?.addEventListener("change", syncDifficultyUI);
  elements.autoTrackToggle?.addEventListener("change", handleAutoTrackToggle);
}

function applyTheme(theme) {
  const root = document.body;
  if (!root) return;
  root.classList.remove("theme-dark", "theme-light");
  root.classList.add(`theme-${theme}`);
  state.theme = theme;
  updateThemeButton(theme);
}

function updateThemeButton(theme) {
  if (!elements.themeToggle) return;
  const label = theme === THEME_DARK ? "Switch to light theme" : "Switch to dark theme";
  elements.themeToggle.setAttribute("aria-label", label);
}

function handleThemeToggle() {
  const next = state.theme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
  applyTheme(next);
  try {
    chrome.storage.sync.set({ [THEME_STORAGE_KEY]: next });
  } catch (error) {
    console.debug("Theme preference save failed:", error);
  }
}



async function loadSettings() {
  const stored = await chrome.storage.sync.get({
    apiBaseUrl: DEFAULT_API_BASE,
    authToken: null,
    userProfile: null,
    [THEME_STORAGE_KEY]: THEME_DARK
  });

  state.apiBaseUrl = stored.apiBaseUrl || DEFAULT_API_BASE;
  state.theme = stored[THEME_STORAGE_KEY] === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
  applyTheme(state.theme);
  state.authToken = stored.authToken || null;
  state.user = stored.userProfile || null;

  if (elements.apiBase) {
    elements.apiBase.value = state.apiBaseUrl;
  }
}

async function ensureAuthentication() {
  setView("loading");

  if (state.authToken) {
    const verified = await verifyToken(state.authToken);
    if (verified) {
      return showMainView();
    }
  }

  resetAuthState();
  setView("auth");
}

function resetAuthState() {
  state.authToken = null;
  state.user = null;
  state.autoTrackEnabled = false;
  state.recentSolved = [];
  if (elements.autoTrackToggle) {
    elements.autoTrackToggle.checked = false;
    elements.autoTrackToggle.disabled = true;
  }
  renderRecentSolved([]);
  updateAutoTrackStatus(false, [], "Sign in to enable auto tracking.");
}


async function verifyToken(token) {
  try {
    const endpoint = new URL("/api/auth/verify", state.apiBaseUrl).toString();
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Invalid session");
    }

    const data = await response.json();
    const user = mapUser(data.user || data);

    state.user = user;
    state.authToken = token;

    await chrome.storage.sync.set({
      apiBaseUrl: state.apiBaseUrl,
      authToken: token,
      userProfile: user
    });

    return true;
  } catch (error) {
    await chrome.storage.sync.set({
      authToken: null,
      userProfile: null
    });
    return false;
  }
}

function setView(view) {
  if (elements.loadingCard) {
    elements.loadingCard.classList.toggle("hidden", view !== "loading");
  }
  if (elements.authSection) {
    elements.authSection.classList.toggle("hidden", view !== "auth");
  }
  if (elements.mainSection) {
    elements.mainSection.classList.toggle("hidden", view !== "main");
  }
}

function showMainView() {
  setView("main");
  populateUserSummary();
  syncAutoTrackControls();
  hydrateFromActiveTab();
}

function populateUserSummary() {
  if (!state.user) return;
  const displayName = state.user.name || state.user.username || "CodeVault User";
  const initials = deriveInitials(displayName);

  elements.userName.textContent = displayName;
  elements.userEmail.textContent = state.user.email || "";
  elements.userAvatar.textContent = initials;
}

async function syncAutoTrackControls() {
  if (!elements.autoTrackToggle || !elements.autoTrackStatus) return;
  if (!state.authToken) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_AUTO_TRACK_STATE"
    });

    if (!response?.success) {
      throw new Error(response?.message || "Unable to load auto tracking.");
    }

    const data = response.data || {};
    state.autoTrackEnabled = data.enabled !== false;
    state.recentSolved = Array.isArray(data.recentSolved)
      ? data.recentSolved.slice(0, RECENT_SOLVED_LIMIT)
      : [];

    updateAutoTrackToggleUI();
    renderRecentSolved(state.recentSolved);
    updateAutoTrackStatus(state.autoTrackEnabled, state.recentSolved);
  } catch (error) {
    console.debug("Auto track sync failed:", error?.message || error);
    if (elements.autoTrackToggle) {
      elements.autoTrackToggle.checked = false;
      elements.autoTrackToggle.disabled = true;
    }
    updateAutoTrackStatus(false, [], "Auto tracking unavailable.");
  }
}

function updateAutoTrackToggleUI() {
  if (!elements.autoTrackToggle) return;
  elements.autoTrackToggle.checked = !!state.autoTrackEnabled;
  elements.autoTrackToggle.disabled = false;
}

function updateAutoTrackStatus(enabled, recentSolved, overrideMessage) {
  if (!elements.autoTrackStatus) return;

  if (overrideMessage) {
    elements.autoTrackStatus.textContent = overrideMessage;
    return;
  }

  if (!enabled) {
    elements.autoTrackStatus.textContent = "Auto tracking off.";
    return;
  }

  const latest = Array.isArray(recentSolved) ? recentSolved[0] : null;
  const timestamp = latest?.solvedAt ? formatRelativeTime(latest.solvedAt) : "";
  const prefix = `Auto tracking on • `;
  elements.autoTrackStatus.textContent = timestamp
    ? `${prefix}last recorded ${timestamp}`
    : `${prefix}waiting for your next Accepted run.`;
}


async function handleAutoTrackToggle(event) {
  const checkbox = event?.target || elements.autoTrackToggle;
  if (!checkbox) return;

  const enabled = !!checkbox.checked;
  checkbox.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SET_AUTO_TRACK_ENABLED",
      payload: { enabled }
    });

    if (!response?.success) {
      throw new Error(response?.message || "Failed to update auto tracking preference.");
    }

    const data = response.data || {};
    state.autoTrackEnabled = data.enabled !== false;
    state.recentSolved = Array.isArray(data.recentSolved)
      ? data.recentSolved.slice(0, RECENT_SOLVED_LIMIT)
      : state.recentSolved;

    updateAutoTrackToggleUI();
    renderRecentSolved(state.recentSolved);
    updateAutoTrackStatus(state.autoTrackEnabled, state.recentSolved);
  } catch (error) {
    console.debug("Auto track toggle error:", error?.message || error);
    checkbox.checked = !enabled;
    showBanner(error?.message || "Failed to update auto tracking preference.", "error");
  } finally {
    checkbox.disabled = false;
  }
}

function renderRecentSolved(items) {
  if (!elements.lastSolvedList) return;
  elements.lastSolvedList.innerHTML = "";

  const wrapper = elements.lastSolvedList.closest(".recent-solved");
  if (wrapper) {
    wrapper.classList.toggle("recent-solved--empty", !items || items.length === 0);
  }

  if (!items || items.length === 0) {
    const placeholder = document.createElement("li");
    placeholder.className = "muted";
    placeholder.dataset.placeholder = "true";
    placeholder.textContent = "No auto-tracked solves yet.";
    elements.lastSolvedList.appendChild(placeholder);
    return;
  }

  items.slice(0, RECENT_SOLVED_LIMIT).forEach((item) => {
    const entry = document.createElement("li");

    const titleNode = item.link ? document.createElement("a") : document.createElement("span");
    titleNode.className = "last-solved-title";
    titleNode.textContent = item.title || "Untitled Problem";
    if (item.link) {
      titleNode.href = item.link;
      titleNode.target = "_blank";
      titleNode.rel = "noopener noreferrer";
    }
    entry.appendChild(titleNode);

    const meta = document.createElement("span");
    meta.className = "last-solved-meta";

    const left = document.createElement("span");
    const platformLabel = normalizePlatformForUi(item.platform, item.link);
    const chips = [
      platformLabel,
      item.difficulty || "Medium"
    ];
    if (Number.isFinite(Number(item.xpAwarded))) {
      chips.push(`+${Number(item.xpAwarded)} XP`);
    }
    left.textContent = chips.filter(Boolean).join(" â€¢ ");

    const right = document.createElement("span");
    right.textContent = item.solvedAt ? formatRelativeTime(item.solvedAt) : "";

    meta.appendChild(left);
    meta.appendChild(right);
    entry.appendChild(meta);

    elements.lastSolvedList.appendChild(entry);
  });
}

function formatRelativeTime(value) {
  if (!value) return "";
  try {
    const date = value instanceof Date ? value : new Date(value);
    const diffMs = Date.now() - date.getTime();
    if (!Number.isFinite(diffMs)) return "";
    if (diffMs < 60_000) return "just now";
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

async function hydrateFromActiveTab() {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!activeTab?.id) {
    showBanner("Unable to detect the active tab.", "error");
    return;
  }

  state.currentTabId = activeTab.id;
  resetSaveButtonState();

  chrome.tabs.sendMessage(
    state.currentTabId,
    { type: "REQUEST_PROBLEM_DATA" },
    (response) => {
      if (chrome.runtime.lastError) {
        console.debug("Content script error:", chrome.runtime.lastError.message);
        showBanner("Open a supported problem page to capture details.", "error");
        return;
      }

      if (!response?.success) {
        showBanner(response?.message || "No problem detected on this page.", "error");
        clearProblemForm();
        return;
      }

      state.lastScrapedData = response.data;
      populateProblemForm(response.data);
      showBanner("Problem details loaded. Review and save.", "success");
    }
  );
}

function populateProblemForm(data) {
  resetSaveButtonState();
  const normalizedPlatform = normalizePlatformForUi(data.platform, data.link);
  const normalizedDifficultyValue = normalizeDifficultyValue(
    data.metadata?.difficulty,
    normalizedPlatform,
    data.metadata
  );
  const ratingCandidate =
    typeof data.metadata?.difficultyRating === "number"
      ? data.metadata.difficultyRating
      : parseInt(
          data.metadata?.difficulty ??
            data.metadata?.normalizedDifficulty ??
            data.metadata?.rating ??
            "",
          10
        );
  const difficultyRating = Number.isNaN(ratingCandidate) ? null : ratingCandidate;

  elements.title.value = data.title || "";
  elements.platform.value = normalizedPlatform;
  elements.tags.value = (data.tags || []).join(", ");
  elements.code.value = data.code || "";
  elements.notes.value = data.notes || "";
  elements.saveButton.dataset.problemUrl = data.link || "";
  if (elements.difficultyOverride) {
    elements.difficultyOverride.value = "auto";
  }

  state.lastScrapedData = {
    ...data,
    platform: normalizedPlatform,
    metadata: {
      ...data.metadata,
      difficulty: data.metadata?.difficulty ?? normalizedDifficultyValue ?? "Medium",
      normalizedDifficulty: normalizedDifficultyValue ?? data.metadata?.normalizedDifficulty ?? "Medium",
      detectedDifficulty:
        data.metadata?.detectedDifficulty ?? normalizedDifficultyValue ?? "Unknown",
      detectedDisplay:
        data.metadata?.detectedDisplay ?? data.metadata?.displayDifficulty ?? "",
      displayDifficulty: data.metadata?.displayDifficulty ?? "",
      difficultyRating,
      difficultyOverride: "auto"
    }
  };

  syncDifficultyUI();
}

function clearProblemForm() {
  resetSaveButtonState();
  elements.title.value = "";
  elements.platform.value = "";
  elements.difficulty.value = "";
  elements.tags.value = "";
  elements.code.value = "";
  elements.notes.value = "";
  delete elements.saveButton.dataset.problemUrl;
  state.lastScrapedData = null;
}

async function handleSaveProblem(event) {
  event.preventDefault();

  if (!state.lastScrapedData) {
    showBanner("No problem data available to save.", "error");
    return;
  }

  syncDifficultyUI();

  const tags = elements.tags.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const baseMetadata = state.lastScrapedData.metadata || {};
  const platform = elements.platform.value.trim() || state.lastScrapedData.platform;
  const finalDifficulty =
    baseMetadata.normalizedDifficulty ||
    baseMetadata.difficulty ||
    normalizeDifficultyValue(baseMetadata.difficulty, platform, baseMetadata) ||
    "Medium";
  const difficultyRating =
    typeof baseMetadata.difficultyRating === "number" ? baseMetadata.difficultyRating : null;
  const displayDifficulty =
    baseMetadata.displayDifficulty ||
    elements.difficulty.value ||
    (difficultyRating ? `${difficultyRating} (~${finalDifficulty})` : finalDifficulty);
  const difficultyOverride =
    baseMetadata.difficultyOverride || elements.difficultyOverride?.value || "auto";

  const payload = {
    title: elements.title.value.trim(),
    platform,
    link: elements.saveButton.dataset.problemUrl || state.lastScrapedData.link,
    code: elements.code.value,
    tags,
    notes: elements.notes.value.trim(),
    metadata: {
      ...baseMetadata,
      difficulty: finalDifficulty || "Medium",
      difficultyRating,
      displayDifficulty: displayDifficulty || "Unknown",
      difficultyOverride
    }
  };

  if (!payload.title) {
    showBanner("Title is required before saving.", "error");
    return;
  }

  if (!state.authToken) {
    showBanner("Please connect your CodeVault account first.", "error");
    setView("auth");
    return;
  }

  toggleSavingState(true);

  chrome.runtime.sendMessage(
    {
      type: "SAVE_PROBLEM",
      payload: {
        apiBaseUrl: state.apiBaseUrl || DEFAULT_API_BASE,
        authToken: state.authToken,
        problem: payload
      }
    },
    (response) => {
      toggleSavingState(false);

      if (chrome.runtime.lastError) {
        showBanner("Background script unavailable. Refresh extension.", "error");
        return;
      }

      if (!response?.success) {
        showBanner(response?.message || "Unable to save problem.", "error");
        return;
      }

      showBanner("Problem saved to CodeVault!", "success");
      showSaveSuccess();
    }
  );
}

async function handleSaveSettings(event) {
  event.preventDefault();
  const apiBaseUrl = elements.apiBase.value.trim() || DEFAULT_API_BASE;
  state.apiBaseUrl = apiBaseUrl;
  await chrome.storage.sync.set({ apiBaseUrl });
  showBanner("API base URL updated.", "success");
}

async function handleClearSettings(event) {
  event.preventDefault();
  state.apiBaseUrl = DEFAULT_API_BASE;
  elements.apiBase.value = DEFAULT_API_BASE;
  await chrome.storage.sync.set({ apiBaseUrl: DEFAULT_API_BASE });
  showBanner("Settings reset.", "success");
}

async function finalizeAuth(token, user) {
  state.authToken = token;
  state.user = user ? mapUser(user) : state.user;

  await chrome.storage.sync.set({
    apiBaseUrl: state.apiBaseUrl,
    authToken: token,
    userProfile: state.user
  });

  if (!state.user) {
    const verified = await verifyToken(token);
    if (!verified) {
      throw new Error("Failed to validate session.");
    }
  }

  showBanner("Connected to CodeVault!", "success");
  showMainView();
}

async function handleImportFromTab(event) {
  event.preventDefault();

  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!activeTab?.id) {
    showBanner("No active tab available.", "error");
    return;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => ({
        token: localStorage.getItem("authToken"),
        origin: window.location.origin
      })
    });

    const { token, origin } = result?.result || {};

    if (!token) {
      showBanner("Active tab does not contain a CodeVault session.", "error");
      return;
    }

    state.apiBaseUrl = origin || state.apiBaseUrl;
    if (elements.apiBase) {
      elements.apiBase.value = state.apiBaseUrl;
    }

    await finalizeAuth(token, null);
  } catch (error) {
    console.error("Import from tab failed:", error);
    showBanner("Unable to import session from the active tab.", "error");
  }
}

async function handleLogout(event) {
  event.preventDefault();
  await chrome.storage.sync.set({
    authToken: null,
    userProfile: null
  });
  resetAuthState();
  setView("auth");
  showBanner("Logged out of CodeVault.", "success");
}

function handleOpenApp(event) {
  event.preventDefault();
  const url = state.apiBaseUrl || DEFAULT_API_BASE;
  chrome.tabs.create({ url });
}

function toggleSavingState(isSaving) {
  elements.saveButton.classList.remove("saved");
  elements.saveButton.disabled = isSaving;
  elements.saveSpinner.classList.toggle("hidden", !isSaving);
  elements.saveCheckmark.classList.add("hidden");
  elements.saveLabel.textContent = isSaving ? "Saving..." : "Save to CodeVault";
}

function resetSaveButtonState() {
  elements.saveButton.classList.remove("saved");
  elements.saveButton.disabled = false;
  elements.saveSpinner.classList.add("hidden");
  elements.saveCheckmark.classList.add("hidden");
  elements.saveLabel.textContent = "Save to CodeVault";
  if (elements.difficultyOverride) {
    elements.difficultyOverride.value = "auto";
  }
  if (elements.difficulty) {
    elements.difficulty.value = "";
  }
  if (elements.difficultyHint) {
    elements.difficultyHint.textContent = getDefaultDifficultyHint();
  }
}

function getDefaultDifficultyHint() {
  return "Override the detected difficulty when the source does not provide one.";
}

function showSaveSuccess() {
  elements.saveSpinner.classList.add("hidden");
  elements.saveCheckmark.classList.remove("hidden");
  elements.saveLabel.textContent = "Saved!";
  elements.saveButton.classList.add("saved");
  elements.saveButton.disabled = true;

  window.setTimeout(() => {
    elements.saveButton.disabled = false;
    elements.saveButton.classList.remove("saved");
    elements.saveCheckmark.classList.add("hidden");
    elements.saveLabel.textContent = "Save to CodeVault";
  }, 1600);
}

function syncDifficultyUI() {
  if (!elements.difficulty || !state.lastScrapedData) {
    if (elements.difficultyHint) {
      elements.difficultyHint.textContent = getDefaultDifficultyHint();
    }
    return;
  }

  const metadata = state.lastScrapedData.metadata || {};
  const platform = state.lastScrapedData.platform || metadata.platform || elements.platform.value || "Other";
  const overrideValue = elements.difficultyOverride?.value || metadata.difficultyOverride || "auto";
  const resolved = resolveDifficultyState(platform, metadata, overrideValue);

  elements.difficulty.value = resolved.display;
  if (elements.difficultyHint) {
    elements.difficultyHint.textContent = resolved.hint;
  }

  state.lastScrapedData.metadata = {
    ...metadata,
    normalizedDifficulty: resolved.difficulty,
    displayDifficulty: resolved.display,
    difficultyRating: resolved.rating,
    difficultyOverride: overrideValue,
    detectedDifficulty: metadata.detectedDifficulty ?? resolved.normalized,
    detectedDisplay:
      metadata.detectedDisplay ??
      (resolved.rating ? `${resolved.rating} (~${resolved.normalized})` : resolved.normalized)
  };
}

function resolveDifficultyState(platform, metadata = {}, overrideValue = "auto") {
  const baseDifficultySource =
    metadata.detectedDifficulty ??
    metadata.normalizedDifficulty ??
    metadata.difficulty;
  const normalizedAuto =
    normalizeDifficultyValue(baseDifficultySource, platform, metadata) ||
    normalizeDifficultyValue(metadata.difficulty, platform, metadata) ||
    "Medium";

  const ratingCandidate =
    typeof metadata.difficultyRating === "number"
      ? metadata.difficultyRating
      : parseInt(
          metadata.rating ??
            metadata.difficulty ??
            metadata.detectedDifficulty ??
            metadata.normalizedDifficulty ??
            "",
          10
        );
  const rating = Number.isNaN(ratingCandidate) ? null : ratingCandidate;

  let difficulty = normalizedAuto && normalizedAuto !== "Unknown" ? normalizedAuto : "Medium";
  let display = metadata.displayDifficulty || metadata.detectedDisplay || (rating
    ? `${rating} (~${difficulty})`
    : difficulty);
  let hint = rating
    ? `Detected rating ${rating} (~${difficulty}).`
    : getDefaultDifficultyHint();

  if (overrideValue && overrideValue !== "auto") {
    difficulty = overrideValue;
    display = overrideValue;
    hint = "Manual override active for this save.";
  } else if (!metadata.displayDifficulty && !metadata.detectedDisplay && !rating) {
    display = difficulty;
  }

  return {
    difficulty,
    display,
    rating,
    hint,
    normalized: normalizedAuto
  };
}

function showBanner(message, variant) {
  elements.banner.textContent = message;
  elements.banner.className = `banner ${variant}`;
  elements.banner.classList.remove("hidden");

  window.setTimeout(() => {
    elements.banner.classList.add("hidden");
  }, 4000);
}

function mapUser(data) {
  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatarUrl,
    avatarType: data.avatarType,
    leetcodeUsername: data.leetcodeUsername,
    codeforcesUsername: data.codeforcesUsername
  };
}

function deriveInitials(value) {
  if (!value) return "CV";
  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function safeParseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizePlatformForUi(platform, link) {
  const resolved = resolvePlatform(platform);
  if (resolved !== "Other") return resolved;
  const inferred = inferPlatformFromLink(link);
  if (inferred !== "Unknown") return inferred;
  return "Other";
}

function resolvePlatform(value) {
  const normalized = value?.toString().toLowerCase() ?? "";
  if (normalized.includes("leetcode")) return "LeetCode";
  if (normalized.includes("codeforces")) return "CodeForces";
  if (normalized.includes("hacker")) return "HackerRank";
  return "Other";
}

function inferPlatformFromLink(link) {
  if (!link) return "Unknown";
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

function normalizeDifficultyValue(value, platform, metadata = {}) {
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
      parseInt(metadata.difficultyRating, 10) ||
      parseInt(metadata.rating, 10);
    if (!Number.isNaN(ratingFromMeta)) {
      return ratingToDifficulty(ratingFromMeta);
    }
  }

  if (metadata.normalizedDifficulty) {
    return metadata.normalizedDifficulty;
  }

  return "Medium";
}

function ratingToDifficulty(rating) {
  if (rating < 1200) return "Easy";
  if (rating < 1700) return "Medium";
  return "Hard";
}

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}



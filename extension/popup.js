const DEFAULT_API_BASE = "https://your-codevault-api.com";

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
  loginForm: document.getElementById("login-form"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  loginOtp: document.getElementById("login-otp"),
  otpContainer: document.getElementById("otp-container"),
  loginSubmit: document.getElementById("login-submit"),
  loginSpinner: document.querySelector("#login-submit .spinner"),
  loginLabel: document.querySelector("#login-submit .label"),
  importFromTab: document.getElementById("import-from-tab"),
  logoutButton: document.getElementById("logout-button"),
  openAppButton: document.getElementById("open-app"),
  userName: document.getElementById("user-name"),
  userEmail: document.getElementById("user-email"),
  userAvatar: document.getElementById("user-avatar")
};

const state = {
  apiBaseUrl: DEFAULT_API_BASE,
  authToken: null,
  user: null,
  otpSession: null,
  lastScrapedData: null,
  currentTabId: null
};

document.addEventListener("DOMContentLoaded", init);

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
  elements.loginForm?.addEventListener("submit", handleLoginSubmit);
  elements.importFromTab?.addEventListener("click", handleImportFromTab);
  elements.logoutButton?.addEventListener("click", handleLogout);
  elements.openAppButton?.addEventListener("click", handleOpenApp);
  elements.difficultyOverride?.addEventListener("change", syncDifficultyUI);
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get({
    apiBaseUrl: DEFAULT_API_BASE,
    authToken: null,
    userProfile: null
  });

  state.apiBaseUrl = stored.apiBaseUrl || DEFAULT_API_BASE;
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
  state.otpSession = null;
  elements.loginPassword.value = "";
  elements.loginOtp.value = "";
  elements.otpContainer.classList.add("hidden");
  updateLoginButton("Sign In");
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

async function handleLoginSubmit(event) {
  event.preventDefault();

  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value;
  const otp = elements.loginOtp.value.trim();

  if (!email || (!password && !state.otpSession)) {
    showBanner("Enter your email and password.", "error");
    return;
  }

  toggleLoginState(true);

  try {
    if (state.otpSession) {
      await verifyOtp(email, otp);
    } else {
      await attemptLogin(email, password);
    }
  } catch (error) {
    showBanner(error.message || "Authentication failed.", "error");
  } finally {
    toggleLoginState(false);
  }
}

async function attemptLogin(email, password) {
  const endpoint = new URL("/api/auth/login", state.apiBaseUrl).toString();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await safeParseJson(response);

  if (!response.ok) {
    throw new Error(data?.error || "Login failed.");
  }

  if (data?.otpRequired) {
    state.otpSession = data.otpSession;
    elements.otpContainer.classList.remove("hidden");
    elements.loginOtp.focus();
    updateLoginButton("Verify Code");
    showBanner("Enter the verification code sent to your email.", "success");
    return;
  }

  await finalizeAuth(data.token, data.user);
}

async function verifyOtp(email, otp) {
  if (!otp) {
    throw new Error("Enter the verification code.");
  }

  const endpoint = new URL("/api/auth/login/verify", state.apiBaseUrl).toString();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      otp,
      otpSession: state.otpSession
    })
  });

  const data = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(data?.error || "OTP verification failed.");
  }

  state.otpSession = null;
  elements.otpContainer.classList.add("hidden");
  elements.loginOtp.value = "";
  updateLoginButton("Sign In");

  await finalizeAuth(data.token, data.user);
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

function toggleLoginState(isLoading) {
  elements.loginSubmit.disabled = isLoading;
  elements.loginSpinner.classList.toggle("hidden", !isLoading);
  elements.loginLabel.textContent = isLoading
    ? state.otpSession
      ? "Verifying..."
      : "Signing in..."
    : state.otpSession
      ? "Verify Code"
      : "Sign In";
}

function updateLoginButton(text) {
  elements.loginLabel.textContent = text;
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
    avatarType: data.avatarType
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



/**
 * Trackr Chrome extension popup.
 * Verifies sign-in state via GET /api/ext/me, shows sign-in prompt when signed out,
 * and saves jobs when signed in. Handles 401 by clearing key and prompting sign-in again.
 */

const DEFAULT_TRACKR_URL = "http://localhost:3000";
const STORAGE_KEYS = { apiKey: "trackr_api_key", trackrUrl: "trackr_url" };

const loadingEl = document.getElementById("loadingState");
const mainContent = document.getElementById("mainContent");
const signInSection = document.getElementById("signInSection");
const signedInBar = document.getElementById("signedInBar");
const saveSection = document.getElementById("saveSection");
const signInPrompt = document.getElementById("signInPrompt");
const trackrUrlEl = document.getElementById("trackrUrl");
const apiKeyEl = document.getElementById("apiKey");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const openTrackrGetKeyLink = document.getElementById("openTrackrGetKeyLink");
const jobUrlEl = document.getElementById("jobUrl");
const jobTitleEl = document.getElementById("jobTitle");
const companyNameEl = document.getElementById("companyName");
const saveJobBtn = document.getElementById("saveJobBtn");
const openTrackrLink = document.getElementById("openTrackrLink");
const messageEl = document.getElementById("message");

let signedIn = false;

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message " + (type === "error" ? "error" : "success");
  messageEl.classList.remove("hidden");
}

function hideMessage() {
  messageEl.classList.add("hidden");
}

function setSignedIn(value) {
  signedIn = !!value;
  signInSection.classList.toggle("hidden", signedIn);
  signedInBar.classList.toggle("hidden", !signedIn);
  signInPrompt.classList.toggle("hidden", signedIn);
  saveJobBtn.disabled = false;
}

function getTrackrUrl() {
  return (trackrUrlEl.value || DEFAULT_TRACKR_URL).replace(/\/$/, "");
}

/**
 * Verify API key with the backend. Returns true if valid, false otherwise.
 */
async function verifySession(apiKey, baseUrl) {
  if (!apiKey || !baseUrl) return false;
  try {
    const res = await fetch(baseUrl + "/api/ext/me", {
      method: "GET",
      headers: { "X-Trackr-API-Key": apiKey },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Clear stored key and show sign-in state. Call after 401 or sign out.
 */
async function clearSession() {
  await chrome.storage.local.remove([STORAGE_KEYS.apiKey, STORAGE_KEYS.trackrUrl]);
  trackrUrlEl.value = DEFAULT_TRACKR_URL;
  apiKeyEl.value = "";
  apiKeyEl.placeholder = "Paste your API key from the dashboard";
  setSignedIn(false);
  openTrackrLink.href = DEFAULT_TRACKR_URL;
  openTrackrGetKeyLink.href = DEFAULT_TRACKR_URL + "/dashboard";
}

async function getActiveTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url && (tab.url.startsWith("http:") || tab.url.startsWith("https:"))) {
    return tab.url;
  }
  return "";
}

// --- Sign in
signInBtn.addEventListener("click", async () => {
  const key = apiKeyEl.value.trim();
  const url = getTrackrUrl();
  if (!key) {
    showMessage("Enter your API key from the Trackr dashboard.", "error");
    return;
  }
  hideMessage();

  signInBtn.disabled = true;
  const valid = await verifySession(key, url);
  signInBtn.disabled = false;

  if (!valid) {
    showMessage("Invalid API key or Trackr unreachable. Check the URL and key.", "error");
    return;
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.apiKey]: key,
    [STORAGE_KEYS.trackrUrl]: url,
  });
  openTrackrLink.href = url;
  openTrackrGetKeyLink.href = url + "/dashboard";
  setSignedIn(true);
  showMessage("You're signed in.", "success");
});

// --- Sign out
signOutBtn.addEventListener("click", async () => {
  hideMessage();
  await clearSession();
});

// --- Save job
saveJobBtn.addEventListener("click", async () => {
  hideMessage();

  if (!signedIn) {
    showMessage("Please sign in to Trackr to save jobs.", "error");
    signInSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }

  const out = await chrome.storage.local.get([STORAGE_KEYS.apiKey, STORAGE_KEYS.trackrUrl]);
  const apiKey = out[STORAGE_KEYS.apiKey];
  const baseUrl = out[STORAGE_KEYS.trackrUrl] || getTrackrUrl();

  if (!apiKey) {
    setSignedIn(false);
    showMessage("Please sign in to Trackr to save jobs.", "error");
    signInSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }

  const jobUrl = (jobUrlEl.value || "").trim();
  const jobTitle = (jobTitleEl.value || "").trim();
  const companyName = (companyNameEl.value || "").trim();

  if (!jobUrl) {
    showMessage("Job URL is required. Open a job listing page and try again.", "error");
    return;
  }
  if (!jobTitle) {
    showMessage("Job title is required.", "error");
    return;
  }
  if (!companyName) {
    showMessage("Company name is required.", "error");
    return;
  }

  const saveUrl = baseUrl.replace(/\/$/, "") + "/api/ext/save";
  saveJobBtn.disabled = true;

  try {
    const res = await fetch(saveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Trackr-API-Key": apiKey,
      },
      body: JSON.stringify({ jobTitle, companyName, jobUrl }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      showMessage("Saved to Trackr.", "success");
      jobTitleEl.value = "";
      companyNameEl.value = "";
    } else if (res.status === 401) {
      await clearSession();
      showMessage("Your session expired or key is invalid. Please sign in again.", "error");
      signInSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      showMessage(data.error || "Failed to save.", "error");
    }
  } catch {
    showMessage("Network error. Is Trackr running at " + baseUrl + "?", "error");
  } finally {
    saveJobBtn.disabled = false;
  }
});

// --- Init: load storage, verify key, show UI
(async () => {
  const stored = await chrome.storage.local.get([STORAGE_KEYS.apiKey, STORAGE_KEYS.trackrUrl]);
  const url = (stored[STORAGE_KEYS.trackrUrl] || DEFAULT_TRACKR_URL).replace(/\/$/, "");
  const key = stored[STORAGE_KEYS.apiKey] || "";

  trackrUrlEl.value = url;
  openTrackrLink.href = url;
  openTrackrGetKeyLink.href = url + "/dashboard";

  jobUrlEl.value = await getActiveTabUrl();

  if (key) {
    const valid = await verifySession(key, url);
    if (!valid) {
      await chrome.storage.local.remove(STORAGE_KEYS.apiKey);
      apiKeyEl.placeholder = "Paste your API key from the dashboard";
    }
    setSignedIn(valid);
  } else {
    setSignedIn(false);
  }

  loadingEl.classList.add("hidden");
  mainContent.classList.remove("hidden");
})();

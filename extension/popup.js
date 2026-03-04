/**
 * Trackr Chrome extension popup script.
 * Loads/saves API key and Trackr URL, fills job URL from active tab, sends save request.
 */

const DEFAULT_TRACKR_URL = "http://localhost:3000";
const STORAGE_KEYS = { apiKey: "trackr_api_key", trackrUrl: "trackr_url" };

const trackrUrlEl = document.getElementById("trackrUrl");
const apiKeyEl = document.getElementById("apiKey");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const clearKeyBtn = document.getElementById("clearKeyBtn");
const keyStatusEl = document.getElementById("keyStatus");
const jobUrlEl = document.getElementById("jobUrl");
const jobTitleEl = document.getElementById("jobTitle");
const companyNameEl = document.getElementById("companyName");
const saveJobBtn = document.getElementById("saveJobBtn");
const openTrackrLink = document.getElementById("openTrackrLink");
const messageEl = document.getElementById("message");

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message " + (type === "error" ? "error" : "success");
  messageEl.style.display = "block";
}

function hideMessage() {
  messageEl.style.display = "none";
}

function setKeySaved(hasKey) {
  if (hasKey) {
    keyStatusEl.textContent = "API key saved.";
    keyStatusEl.classList.add("saved");
    apiKeyEl.placeholder = "••••••••••••";
    apiKeyEl.value = "";
  } else {
    keyStatusEl.textContent = "No API key saved. Paste your key from the Trackr dashboard.";
    keyStatusEl.classList.remove("saved");
    apiKeyEl.placeholder = "Paste key from Dashboard → Save from browser";
  }
}

async function loadStored() {
  const out = await chrome.storage.local.get([STORAGE_KEYS.apiKey, STORAGE_KEYS.trackrUrl]);
  const url = out[STORAGE_KEYS.trackrUrl] || DEFAULT_TRACKR_URL;
  const key = out[STORAGE_KEYS.apiKey] || "";
  trackrUrlEl.value = url.replace(/\/$/, "");
  if (key) {
    setKeySaved(true);
  } else {
    setKeySaved(false);
  }
  openTrackrLink.href = url;
}

async function getActiveTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url && (tab.url.startsWith("http:") || tab.url.startsWith("https:"))) {
    return tab.url;
  }
  return "";
}

function getTrackrUrl() {
  return (trackrUrlEl.value || DEFAULT_TRACKR_URL).replace(/\/$/, "");
}

saveKeyBtn.addEventListener("click", async () => {
  const key = apiKeyEl.value.trim();
  const url = getTrackrUrl();
  if (!key) {
    showMessage("Enter your API key from the Trackr dashboard.", "error");
    return;
  }
  await chrome.storage.local.set({
    [STORAGE_KEYS.apiKey]: key,
    [STORAGE_KEYS.trackrUrl]: url,
  });
  setKeySaved(true);
  openTrackrLink.href = url;
  showMessage("Key and URL saved.", "success");
});

clearKeyBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove([STORAGE_KEYS.apiKey, STORAGE_KEYS.trackrUrl]);
  trackrUrlEl.value = DEFAULT_TRACKR_URL;
  setKeySaved(false);
  openTrackrLink.href = DEFAULT_TRACKR_URL;
  hideMessage();
});

saveJobBtn.addEventListener("click", async () => {
  hideMessage();
  const out = await chrome.storage.local.get(STORAGE_KEYS.apiKey);
  const apiKey = out[STORAGE_KEYS.apiKey];
  if (!apiKey) {
    showMessage("Save your API key first (from Trackr dashboard).", "error");
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

  const baseUrl = getTrackrUrl();
  const saveUrl = baseUrl + "/api/ext/save";

  saveJobBtn.disabled = true;
  try {
    const res = await fetch(saveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Trackr-API-Key": apiKey,
      },
      body: JSON.stringify({
        jobTitle,
        companyName,
        jobUrl,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      showMessage("Saved to Trackr.", "success");
      jobTitleEl.value = "";
      companyNameEl.value = "";
    } else {
      const msg = data.error || "Failed to save.";
      showMessage(msg, "error");
    }
  } catch (err) {
    showMessage("Network error. Is Trackr running at " + baseUrl + "?", "error");
  } finally {
    saveJobBtn.disabled = false;
  }
});

// Load storage and active tab URL on open
(async () => {
  await loadStored();
  const url = await getActiveTabUrl();
  jobUrlEl.value = url;
})();

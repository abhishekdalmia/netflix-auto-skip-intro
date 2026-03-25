const STORAGE_KEY = "nas_enabled";

function setStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg || "";
}

function setToggle(checked) {
  const input = document.getElementById("enabled");
  if (input) input.checked = Boolean(checked);
}

function getEnabled() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ [STORAGE_KEY]: true }, (items) => {
      resolve(Boolean(items?.[STORAGE_KEY]));
    });
  });
}

function setEnabled(enabled) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: Boolean(enabled) }, () => resolve());
  });
}

async function init() {
  const enabled = await getEnabled();
  setToggle(enabled);
  setStatus(enabled ? "Enabled on Netflix tabs." : "Disabled.");

  const input = document.getElementById("enabled");
  input.addEventListener("change", async () => {
    const next = input.checked;
    await setEnabled(next);
    setStatus(next ? "Enabled on Netflix tabs." : "Disabled.");
  });
}

document.addEventListener("DOMContentLoaded", init);


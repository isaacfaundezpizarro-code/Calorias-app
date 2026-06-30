import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const STORAGE_KEY = "calorias_app_v1";
const GUEST_STORAGE_KEY = `${STORAGE_KEY}_guest`;
const MAX_PHOTO_SIZE = 1400;
const AI_PHOTO_SIZE = 1600;
const JPEG_QUALITY = 0.78;

const QUICK_FOODS = [
  { name: "Huevo cocido", calories: 78, protein: 6, meal: "desayuno" },
  { name: "Avena (1 taza)", calories: 150, protein: 5, meal: "desayuno" },
  { name: "Platano", calories: 105, protein: 1, meal: "snack" },
  { name: "Arroz (1 taza)", calories: 206, protein: 4, meal: "almuerzo" },
  { name: "Pollo (100 g)", calories: 165, protein: 31, meal: "almuerzo" },
  { name: "Ensalada mixta", calories: 120, protein: 2, meal: "cena" },
  { name: "Yogurt natural", calories: 100, protein: 9, meal: "snack" },
  { name: "Manzana", calories: 95, protein: 0, meal: "snack" },
];

const MEAL_LABELS = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
  snack: "Snack",
};

const form = document.getElementById("food-form");
const nameInput = document.getElementById("food-name");
const caloriesInput = document.getElementById("calories");
const proteinInput = document.getElementById("protein");
const mealInput = document.getElementById("meal");
const portionInput = document.getElementById("portion");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const datePicker = document.getElementById("date-picker");
const goalInput = document.getElementById("goal-input");
const saveGoalBtn = document.getElementById("save-goal-btn");

const searchInput = document.getElementById("search");
const mealFilter = document.getElementById("meal-filter");
const foodList = document.getElementById("food-list");
const emptyMessage = document.getElementById("empty-message");
const template = document.getElementById("food-template");
const quickAddButtons = document.getElementById("quick-add-buttons");

const statConsumed = document.getElementById("stat-consumed");
const statGoal = document.getElementById("stat-goal");
const statRemaining = document.getElementById("stat-remaining");
const statProtein = document.getElementById("stat-protein");
const progressPercent = document.getElementById("progress-percent");
const progressRingFill = document.querySelector(".progress-ring__fill");
const mealBreakdown = document.getElementById("meal-breakdown");

const openCameraBtn = document.getElementById("open-camera-btn");
const pickPhotoBtn = document.getElementById("pick-photo-btn");
const photoFileInput = document.getElementById("photo-file");
const photoPreview = document.getElementById("photo-preview");
const photoPreviewImg = document.getElementById("photo-preview-img");
const removePhotoBtn = document.getElementById("remove-photo-btn");
const analyzePhotoBtn = document.getElementById("analyze-photo-btn");

const aiAnalysis = document.getElementById("ai-analysis");
const aiAnalysisStatus = document.getElementById("ai-analysis-status");
const aiResult = document.getElementById("ai-result");
const aiResultText = document.getElementById("ai-result-text");

const cameraModal = document.getElementById("camera-modal");
const cameraVideo = document.getElementById("camera-video");
const cameraCanvas = document.getElementById("camera-canvas");
const cameraError = document.getElementById("camera-error");
const captureBtn = document.getElementById("capture-btn");
const switchCameraBtn = document.getElementById("switch-camera-btn");
const cameraCancelBtn = document.getElementById("camera-cancel-btn");
const cameraStatus = document.getElementById("camera-status");
const cameraHelp = document.getElementById("camera-help");

const photoLightbox = document.getElementById("photo-lightbox");
const photoLightboxImg = document.getElementById("photo-lightbox-img");
const closeLightboxBtn = document.getElementById("close-lightbox-btn");
const authCard = document.getElementById("auth-card");
const authAvatar = document.getElementById("auth-avatar");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const googleLoginBtn = document.getElementById("google-login-btn");
const logoutBtn = document.getElementById("logout-btn");
const dashboardPage = document.getElementById("dashboard-page");
const userPage = document.getElementById("user-page");
const navDashboard = document.getElementById("nav-dashboard");
const navUser = document.getElementById("nav-user");
const userPageAvatar = document.getElementById("user-page-avatar");
const userPageName = document.getElementById("user-page-name");
const userPageEmail = document.getElementById("user-page-email");
const userPageMode = document.getElementById("user-page-mode");
const userPageGoal = document.getElementById("user-page-goal");
const userPageProteinGoal = document.getElementById("user-page-protein-goal");
const settingsAccountBadge = document.getElementById("settings-account-badge");
const settingDisplayName = document.getElementById("setting-display-name");
const settingProteinGoal = document.getElementById("setting-protein-goal");
const settingTheme = document.getElementById("setting-theme");
const settingAutoAnalyze = document.getElementById("setting-auto-analyze");
const settingReducedMotion = document.getElementById("setting-reduced-motion");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const exportDataBtn = document.getElementById("export-data-btn");
const resetDataBtn = document.getElementById("reset-data-btn");

let currentUser = null;
let auth = null;
let data = loadData();
let editingEntryId = null;
let selectedDate = todayString();
let pendingPhoto = null;
let pendingPhotoForAi = null;
let cameraStream = null;
let useFrontCamera = false;
let aiAnalyzing = false;

datePicker.value = selectedDate;
goalInput.value = data.goal;

setupCameraUi();
setupAuth();
setupPageNavigation();
setupSettingsUi();
applySettings();
syncSettingsForm();
renderQuickAddButtons();
render();

function addQuickFood(index) {
  const food = QUICK_FOODS[index];
  if (!food) return;

  data.entries.unshift({
    id: createId(),
    date: selectedDate,
    name: food.name,
    calories: food.calories,
    protein: food.protein ?? 0,
    meal: food.meal,
    portion: "",
    photo: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  searchInput.value = "";
  mealFilter.value = "todas";
  clearEditingMode();
  saveData();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const payload = readForm();
  if (!payload) return;

  if (editingEntryId) {
    data.entries = data.entries.map((entry) =>
      entry.id === editingEntryId
        ? { ...entry, ...payload, updatedAt: new Date().toISOString() }
        : entry
    );
    clearEditingMode();
  } else {
    data.entries.unshift({
      id: createId(),
      date: selectedDate,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveData();
  resetForm();
  render();
});

cancelEditBtn.addEventListener("click", () => {
  clearEditingMode();
  resetForm();
});

datePicker.addEventListener("change", () => {
  selectedDate = datePicker.value || todayString();
  clearEditingMode();
  resetForm();
  render();
});

openCameraBtn.addEventListener("click", () => {
  if (!canUseLiveCamera()) {
    cameraHelp.classList.remove("hidden");
    photoFileInput.click();
    return;
  }
  openCameraModal();
});
pickPhotoBtn.addEventListener("click", () => photoFileInput.click());
removePhotoBtn.addEventListener("click", () => {
  pendingPhoto = null;
  pendingPhotoForAi = null;
  hideAiFeedback();
  updatePhotoPreview();
});
analyzePhotoBtn?.addEventListener("click", () => {
  if (pendingPhoto) analyzePhotoWithAi();
});
photoPreviewImg.addEventListener("click", () => {
  if (pendingPhoto) openPhotoLightbox(pendingPhoto);
});

photoFileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const loaded = await loadImageFile(file);
    pendingPhoto = loaded.storage;
    pendingPhotoForAi = loaded.ai;
    updatePhotoPreview();
    maybeAnalyzePhotoAutomatically();
  } catch {
    alert("No se pudo cargar la imagen. Intenta con otro archivo.");
  }

  photoFileInput.value = "";
});

captureBtn.addEventListener("click", () => {
  if (!cameraVideo.videoWidth) {
    alert("Espera un momento a que la camara este lista.");
    return;
  }

  pendingPhoto = captureFromVideo();
  closeCameraModal();
  updatePhotoPreview();
  maybeAnalyzePhotoAutomatically();
});

switchCameraBtn.addEventListener("click", () => {
  useFrontCamera = !useFrontCamera;
  restartCamera();
});

cameraCancelBtn.addEventListener("click", closeCameraModal);
cameraModal.addEventListener("click", (event) => {
  if (event.target === cameraModal) closeCameraModal();
});

closeLightboxBtn.addEventListener("click", closePhotoLightbox);
photoLightbox.addEventListener("click", (event) => {
  if (event.target === photoLightbox) closePhotoLightbox();
});

saveGoalBtn.addEventListener("click", () => {
  const goal = Number(goalInput.value);
  if (!Number.isFinite(goal) || goal < 500 || goal > 10000) {
    alert("La meta debe estar entre 500 y 10000 kcal.");
    goalInput.value = data.goal;
    return;
  }
  data.goal = goal;
  saveData();
  syncSettingsForm();
  render();
});

searchInput.addEventListener("input", render);
mealFilter.addEventListener("change", render);

foodList.addEventListener("click", (event) => {
  const li = event.target.closest("li");
  if (!li) return;
  const id = li.dataset.id;

  if (event.target.classList.contains("delete-btn")) {
    data.entries = data.entries.filter((entry) => entry.id !== id);
    if (editingEntryId === id) clearEditingMode();
    saveData();
    render();
  }

  if (event.target.classList.contains("edit-btn")) {
    const entry = data.entries.find((item) => item.id === id);
    if (!entry) return;
    editingEntryId = id;
    nameInput.value = entry.name;
    caloriesInput.value = entry.calories;
    proteinInput.value = entry.protein > 0 ? entry.protein : "";
    mealInput.value = entry.meal;
    portionInput.value = entry.portion || "";
    pendingPhoto = entry.photo || null;
    pendingPhotoForAi = entry.photo || null;
    updatePhotoPreview();
    hideAiFeedback();
    submitBtn.textContent = "Guardar cambios";
    cancelEditBtn.classList.remove("hidden");
    nameInput.focus();
  }

  const photoBtn = event.target.closest(".food-card__photo-btn");
  if (photoBtn) {
    const entry = data.entries.find((item) => item.id === id);
    if (entry?.photo) openPhotoLightbox(entry.photo);
  }
});

function renderQuickAddButtons() {
  if (!quickAddButtons) return;

  quickAddButtons.replaceChildren(
    ...QUICK_FOODS.map((food, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.quickFood = String(index);
      button.textContent = `${food.name} · ${food.calories} kcal${food.protein ? ` · ${food.protein} g` : ""}`;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        addQuickFood(index);
      });
      return button;
    })
  );
}

function readForm() {
  const name = nameInput.value.trim();
  const calories = Number(caloriesInput.value);
  const proteinRaw = proteinInput.value.trim();
  const protein = proteinRaw === "" ? 0 : Number(proteinRaw);
  const meal = mealInput.value;
  const portion = portionInput.value.trim();

  if (!name) return null;
  if (!Number.isFinite(calories) || calories < 1) {
    alert("Ingresa una cantidad valida de calorias.");
    return null;
  }
  if (!Number.isFinite(protein) || protein < 0) {
    alert("Ingresa una cantidad valida de proteinas.");
    return null;
  }

  return { name, calories, protein, meal, portion, photo: pendingPhoto || "" };
}

function getEntriesForSelectedDate() {
  return data.entries.filter((entry) => entry.date === selectedDate);
}

function getFilteredEntries() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedMeal = mealFilter.value;

  return getEntriesForSelectedDate().filter((entry) => {
    const textMatch =
      entry.name.toLowerCase().includes(query) ||
      (entry.portion || "").toLowerCase().includes(query);
    const mealMatch = selectedMeal === "todas" || entry.meal === selectedMeal;
    return textMatch && mealMatch;
  });
}

function render() {
  const dayEntries = getEntriesForSelectedDate();
  const filtered = getFilteredEntries();
  const consumed = dayEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const proteinTotal = dayEntries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
  const proteinGoal = Number(data.settings?.proteinGoal) || 0;
  const goal = data.goal;
  const remaining = goal - consumed;
  const percent = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 999) : 0;

  statConsumed.textContent = formatNumber(consumed);
  statGoal.textContent = formatNumber(goal);
  statRemaining.textContent = formatNumber(remaining);
  statProtein.textContent = proteinGoal
    ? `${formatNumber(proteinTotal)} / ${formatNumber(proteinGoal)}`
    : formatNumber(proteinTotal);
  progressPercent.textContent = `${percent}%`;

  statRemaining.classList.toggle("over-goal", remaining < 0);
  progressRingFill.style.strokeDashoffset = `${327 - (327 * Math.min(percent, 100)) / 100}`;
  progressRingFill.classList.toggle("over-goal", percent > 100);
  updateUserPage();

  foodList.innerHTML = "";
  filtered.forEach((entry) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = entry.id;

    node.querySelector(".food-card__name").textContent = entry.name;
    node.querySelector(".food-card__portion").textContent =
      entry.portion || "Sin porcion indicada";
    node.querySelector(".food-card__calories").textContent = `${entry.calories} kcal`;
    const proteinEl = node.querySelector(".food-card__protein");
    if (entry.protein > 0) {
      proteinEl.textContent = `${entry.protein} g prot`;
      proteinEl.classList.remove("hidden");
    } else {
      proteinEl.classList.add("hidden");
    }
    node.querySelector(".food-card__meta").innerHTML = `
      <span class="meal-tag meal-tag--${entry.meal}">${MEAL_LABELS[entry.meal]}</span>
      <span>${formatTime(entry.createdAt)}</span>
    `;

    const photoBtn = node.querySelector(".food-card__photo-btn");
    const photoImg = node.querySelector(".food-card__photo");
    if (entry.photo) {
      photoImg.src = entry.photo;
      photoImg.alt = `Foto de ${entry.name}`;
      photoBtn.classList.remove("hidden");
    }

    foodList.appendChild(node);
  });

  emptyMessage.classList.toggle("hidden", filtered.length > 0);
  renderMealBreakdown(dayEntries);
}

function renderMealBreakdown(dayEntries) {
  const totals = {
    desayuno: 0,
    almuerzo: 0,
    cena: 0,
    snack: 0,
  };

  dayEntries.forEach((entry) => {
    totals[entry.meal] += entry.calories;
  });

  mealBreakdown.innerHTML = Object.entries(totals)
    .map(
      ([meal, total]) =>
        `<span class="breakdown-item"><strong>${MEAL_LABELS[meal]}:</strong> ${formatNumber(total)} kcal</span>`
    )
    .join("");
}

function clearEditingMode() {
  editingEntryId = null;
  submitBtn.textContent = "Agregar";
  cancelEditBtn.classList.add("hidden");
}

function resetForm() {
  form.reset();
  mealInput.value = "desayuno";
  pendingPhoto = null;
  pendingPhotoForAi = null;
  hideAiFeedback();
  updatePhotoPreview();
}

function updatePhotoPreview() {
  if (pendingPhoto) {
    photoPreviewImg.src = pendingPhoto;
    photoPreview.classList.remove("hidden");
    cameraStatus.textContent = "Foto lista. La IA estima las calorias; revisa y ajusta abajo si hace falta.";
  } else {
    photoPreviewImg.removeAttribute("src");
    photoPreview.classList.add("hidden");
    cameraStatus.textContent = "Toma una foto y la IA estimara las calorias automaticamente.";
  }
}

function hideAiFeedback() {
  aiAnalysis?.classList.add("hidden");
  aiResult?.classList.add("hidden");
  aiResult?.classList.remove("ai-result--error");
}

function showAiLoading(message) {
  hideAiFeedback();
  if (aiAnalysisStatus) aiAnalysisStatus.textContent = message;
  aiAnalysis?.classList.remove("hidden");
  if (analyzePhotoBtn) analyzePhotoBtn.disabled = true;
}

function showAiResult(message, isError = false) {
  aiAnalysis?.classList.add("hidden");
  if (aiResultText) aiResultText.textContent = message;
  aiResult?.classList.toggle("ai-result--error", isError);
  aiResult?.classList.remove("hidden");
  if (analyzePhotoBtn) analyzePhotoBtn.disabled = false;
}

async function analyzePhotoWithAi() {
  const image = pendingPhotoForAi || pendingPhoto;
  if (!image || aiAnalyzing) return;

  aiAnalyzing = true;
  showAiLoading("Analizando comida con IA...");

  try {
    const response = await fetch("/api/analyze-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      showAiResult(
        result.error ||
          "No se pudo analizar la foto. Usa vercel dev o publica en Vercel con GROQ_API_KEY.",
        true
      );
      return;
    }

    nameInput.value = result.name || "";
    caloriesInput.value = result.calories || "";
    proteinInput.value = result.protein > 0 ? result.protein : "";
    mealInput.value = result.meal || mealInput.value;
    portionInput.value = result.portion || "";

    const mealLabel = MEAL_LABELS[result.meal] || result.meal;
    const proteinNote = result.protein > 0 ? ` · ~${result.protein} g prot` : "";
    showAiResult(
      `IA detecto: ${result.name} · ~${result.calories} kcal${proteinNote} (${result.portion || "porcion estimada"}) · ${mealLabel}. Revisa y pulsa Agregar.`
    );
    caloriesInput.focus();
  } catch {
    showAiResult(
      "Error de conexion con la IA. Comprueba que usas vercel dev o la app publicada en Vercel.",
      true
    );
  } finally {
    aiAnalyzing = false;
    analyzePhotoBtn.disabled = false;
  }
}

function canUseLiveCamera() {
  return window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);
}

function setupCameraUi() {
  if (canUseLiveCamera()) {
    openCameraBtn.disabled = false;
    cameraHelp.classList.add("hidden");
    return;
  }

  openCameraBtn.textContent = "Usar camara del telefono";
  cameraHelp.textContent =
    "La camara en vivo necesita abrir la app desde http://localhost:8080 (ejecuta ./start.sh). Por ahora usa 'Elegir foto / galeria'.";
  cameraHelp.classList.remove("hidden");
}

async function openCameraModal() {
  cameraModal.classList.remove("hidden");
  cameraError.classList.add("hidden");
  captureBtn.disabled = true;
  useFrontCamera = false;

  await restartCamera();
}

async function restartCamera() {
  stopCamera();
  cameraError.classList.add("hidden");
  captureBtn.disabled = true;

  if (!canUseLiveCamera()) {
    cameraError.textContent = "Camara no disponible en este modo. Usa 'Elegir foto / galeria'.";
    cameraError.classList.remove("hidden");
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: useFrontCamera ? "user" : { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    cameraVideo.srcObject = cameraStream;
    cameraVideo.onloadedmetadata = () => {
      captureBtn.disabled = false;
    };
  } catch {
    cameraError.textContent =
      "No se pudo acceder a la camara. Revisa permisos del navegador o usa 'Elegir foto / galeria'.";
    cameraError.classList.remove("hidden");
  }
}

function closeCameraModal() {
  stopCamera();
  cameraModal.classList.add("hidden");
  cameraError.classList.add("hidden");
  captureBtn.disabled = false;
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  cameraVideo.srcObject = null;
}

function captureFromVideo() {
  const width = cameraVideo.videoWidth;
  const height = cameraVideo.videoHeight;
  cameraCanvas.width = width;
  cameraCanvas.height = height;
  cameraCanvas.getContext("2d").drawImage(cameraVideo, 0, 0, width, height);
  pendingPhotoForAi = compressCanvas(cameraCanvas, AI_PHOTO_SIZE);
  return compressCanvas(cameraCanvas, MAX_PHOTO_SIZE);
}

function openPhotoLightbox(photoSrc) {
  photoLightboxImg.src = photoSrc;
  photoLightbox.classList.remove("hidden");
}

function closePhotoLightbox() {
  photoLightboxImg.removeAttribute("src");
  photoLightbox.classList.add("hidden");
}

function compressCanvas(sourceCanvas, maxSize = MAX_PHOTO_SIZE) {
  const scale = Math.min(1, maxSize / Math.max(sourceCanvas.width, sourceCanvas.height));
  const width = Math.round(sourceCanvas.width * scale);
  const height = Math.round(sourceCanvas.height * scale);

  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  output.getContext("2d").drawImage(sourceCanvas, 0, 0, width, height);
  return output.toDataURL("image/jpeg", JPEG_QUALITY);
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve({
          storage: compressCanvas(canvas, MAX_PHOTO_SIZE),
          ai: compressCanvas(canvas, AI_PHOTO_SIZE),
        });
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadData() {
  try {
    const raw = localStorage.getItem(getActiveStorageKey());
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    return {
      goal: Number(parsed.goal) || 2000,
      settings: normalizeSettings(parsed.settings),
      entries: Array.isArray(parsed.entries)
        ? parsed.entries.map((entry) => ({
            ...entry,
            protein: Number(entry.protein) || 0,
          }))
        : [],
    };
  } catch {
    return defaultData();
  }
}

function defaultData() {
  return { goal: 2000, settings: defaultSettings(), entries: [] };
}

function defaultSettings() {
  return {
    displayName: "",
    proteinGoal: 120,
    theme: "mint",
    autoAnalyze: true,
    reducedMotion: false,
  };
}

function normalizeSettings(settings = {}) {
  const defaults = defaultSettings();
  const theme = ["mint", "ocean", "graphite"].includes(settings.theme)
    ? settings.theme
    : defaults.theme;

  return {
    displayName: typeof settings.displayName === "string" ? settings.displayName.slice(0, 40) : "",
    proteinGoal: Number.isFinite(Number(settings.proteinGoal))
      ? Math.min(Math.max(Number(settings.proteinGoal), 0), 400)
      : defaults.proteinGoal,
    theme,
    autoAnalyze:
      typeof settings.autoAnalyze === "boolean" ? settings.autoAnalyze : defaults.autoAnalyze,
    reducedMotion:
      typeof settings.reducedMotion === "boolean" ? settings.reducedMotion : defaults.reducedMotion,
  };
}

function saveData() {
  data.settings = normalizeSettings(data.settings);
  localStorage.setItem(getActiveStorageKey(), JSON.stringify(data));
}

function getActiveStorageKey() {
  return currentUser?.uid ? `${STORAGE_KEY}_user_${currentUser.uid}` : GUEST_STORAGE_KEY;
}

function reloadUserData() {
  data = loadData();
  goalInput.value = data.goal;
  applySettings();
  syncSettingsForm();
  clearEditingMode();
  resetForm();
  render();
}

function setupPageNavigation() {
  navDashboard?.addEventListener("click", () => setActivePage("dashboard"));
  navUser?.addEventListener("click", () => setActivePage("user"));
  window.addEventListener("hashchange", () => {
    setActivePage(window.location.hash === "#usuario" ? "user" : "dashboard", false);
  });
  setActivePage(window.location.hash === "#usuario" ? "user" : "dashboard", false);
}

function setActivePage(page, updateHash = true) {
  const showUser = page === "user";
  dashboardPage?.classList.toggle("hidden", showUser);
  userPage?.classList.toggle("hidden", !showUser);
  navDashboard?.classList.toggle("active", !showUser);
  navUser?.classList.toggle("active", showUser);
  navDashboard?.setAttribute("aria-current", showUser ? "false" : "page");
  navUser?.setAttribute("aria-current", showUser ? "page" : "false");

  if (updateHash) {
    history.replaceState(null, "", showUser ? "#usuario" : window.location.pathname);
  }
}

function setupSettingsUi() {
  if (!saveSettingsBtn) return;

  saveSettingsBtn.addEventListener("click", () => {
    const proteinGoal = Number(settingProteinGoal.value);
    data.settings = normalizeSettings({
      displayName: settingDisplayName.value.trim(),
      proteinGoal: Number.isFinite(proteinGoal) ? proteinGoal : defaultSettings().proteinGoal,
      theme: settingTheme.value,
      autoAnalyze: settingAutoAnalyze.checked,
      reducedMotion: settingReducedMotion.checked,
    });
    saveData();
    applySettings();
    syncSettingsForm();
    updateAuthUi(currentUser);
    render();
    saveSettingsBtn.textContent = "Guardado";
    window.setTimeout(() => {
      saveSettingsBtn.textContent = "Guardar configuracion";
    }, 1400);
  });

  settingTheme?.addEventListener("change", () => {
    data.settings = normalizeSettings({ ...data.settings, theme: settingTheme.value });
    saveData();
    applySettings();
  });

  settingReducedMotion?.addEventListener("change", () => {
    data.settings = normalizeSettings({
      ...data.settings,
      reducedMotion: settingReducedMotion.checked,
    });
    saveData();
    applySettings();
  });

  exportDataBtn?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `caloria-${todayString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  resetDataBtn?.addEventListener("click", () => {
    const confirmed = window.confirm("Esto borrara las comidas y configuracion guardadas en este dispositivo.");
    if (!confirmed) return;
    data = defaultData();
    goalInput.value = data.goal;
    saveData();
    applySettings();
    syncSettingsForm();
    clearEditingMode();
    resetForm();
    render();
  });
}

function syncSettingsForm() {
  if (!settingDisplayName) return;
  const settings = normalizeSettings(data.settings);
  settingDisplayName.value = settings.displayName;
  settingProteinGoal.value = settings.proteinGoal;
  settingTheme.value = settings.theme;
  settingAutoAnalyze.checked = settings.autoAnalyze;
  settingReducedMotion.checked = settings.reducedMotion;
  if (settingsAccountBadge) {
    settingsAccountBadge.textContent = currentUser?.email || "Modo local";
  }
  updateUserPage();
}

function applySettings() {
  const settings = normalizeSettings(data.settings);
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.classList.toggle("reduce-motion", settings.reducedMotion);
}

function maybeAnalyzePhotoAutomatically() {
  if (data.settings?.autoAnalyze !== false) analyzePhotoWithAi();
}

function updateUserPage() {
  if (!userPageName) return;
  const localName = data.settings?.displayName?.trim();
  const userName = currentUser?.displayName || localName || "Modo local";
  const userEmail = currentUser?.email || "Sin cuenta Google conectada";
  const avatarLetter = userName.slice(0, 1).toUpperCase();

  userPageName.textContent = userName;
  userPageEmail.textContent = userEmail;
  userPageMode.textContent = currentUser ? "Cuenta Google conectada" : "Datos locales";
  userPageGoal.textContent = `${formatNumber(data.goal)} kcal`;
  userPageProteinGoal.textContent = `${formatNumber(data.settings?.proteinGoal || 0)} g`;
  userPageAvatar.textContent = avatarLetter;
  if (currentUser?.photoURL) {
    userPageAvatar.style.backgroundImage = `url("${currentUser.photoURL}")`;
    userPageAvatar.textContent = "";
  } else {
    userPageAvatar.style.removeProperty("background-image");
  }
}

async function setupAuth() {
  if (!authCard || !googleLoginBtn || !logoutBtn) return;

  if (!isFirebaseConfigured()) {
    updateAuthUi(null, {
      title: "Modo local",
      subtitle: "Configura Firebase para activar cuentas Google.",
      loginDisabled: true,
    });
    return;
  }

  try {
    const [{ initializeApp }, authModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    ]);
    const {
      browserLocalPersistence,
      getAuth,
      GoogleAuthProvider,
      onAuthStateChanged,
      setPersistence,
      signInWithPopup,
      signInWithRedirect,
      signOut,
    } = authModule;
    const firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    setPersistence(auth, browserLocalPersistence).catch(() => {
      // La sesion aun puede funcionar aunque el navegador limite persistencia.
    });

    googleLoginBtn.addEventListener("click", async () => {
      googleLoginBtn.disabled = true;
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        if (error?.code === "auth/popup-blocked") {
          await signInWithRedirect(auth, provider);
          return;
        }
        if (error?.code === "auth/popup-closed-by-user") {
          googleLoginBtn.disabled = false;
          return;
        }
        alert("No se pudo iniciar sesion con Google. Revisa la configuracion de Firebase.");
        googleLoginBtn.disabled = false;
      }
    });

    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
    });

    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      updateAuthUi(user);
      reloadUserData();
    });
  } catch {
    updateAuthUi(null, {
      title: "Google no configurado",
      subtitle: "Revisa firebase-config.js y dominios autorizados en Firebase.",
      loginDisabled: true,
    });
  }
}

function updateAuthUi(user, fallback = {}) {
  if (!authTitle || !authSubtitle || !authAvatar || !googleLoginBtn || !logoutBtn) return;

  if (user) {
    const name = user.displayName || "Usuario";
    authAvatar.textContent = name.slice(0, 1).toUpperCase();
    if (user.photoURL) {
      authAvatar.style.backgroundImage = `url("${user.photoURL}")`;
      authAvatar.textContent = "";
    } else {
      authAvatar.style.removeProperty("background-image");
    }
    authTitle.textContent = name;
    authSubtitle.textContent = user.email || "Sesion iniciada con Google";
    googleLoginBtn.classList.add("hidden");
    googleLoginBtn.disabled = false;
    logoutBtn.classList.remove("hidden");
    return;
  }

  authAvatar.textContent = "C";
  authAvatar.style.removeProperty("background-image");
  const localName = data.settings?.displayName?.trim();
  authAvatar.textContent = localName ? localName.slice(0, 1).toUpperCase() : "C";
  authTitle.textContent = fallback.title || localName || "Modo local";
  authSubtitle.textContent =
    fallback.subtitle || "Inicia sesion con Google para usar tus datos en esta cuenta.";
  googleLoginBtn.classList.remove("hidden");
  googleLoginBtn.disabled = Boolean(fallback.loginDisabled);
  logoutBtn.classList.add("hidden");
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `entry-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-ES").format(value);
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

registerServiceWorker();
setupIosInstallBanner();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // La app funciona sin service worker (por ejemplo en file://).
    });
  });
}

function setupIosInstallBanner() {
  const banner = document.getElementById("ios-install-banner");
  const dismissBtn = document.getElementById("dismiss-install-banner");
  if (!banner || !dismissBtn) return;

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  const dismissed = localStorage.getItem("calorias_install_banner_dismissed") === "1";

  if (isIos && !isStandalone && !dismissed && window.isSecureContext) {
    banner.classList.remove("hidden");
  }

  dismissBtn.addEventListener("click", () => {
    banner.classList.add("hidden");
    localStorage.setItem("calorias_install_banner_dismissed", "1");
  });
}

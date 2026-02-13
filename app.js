/* UI-only prototype (no backend yet)
   - Fake login/signup toggling
   - Modal add transaction
   - LocalStorage persistence for transactions
*/

const $ = (sel) => document.querySelector(sel);

const authView = $("#authView");
const appView = $("#appView");

const authTitle = $("#authTitle");
const authSubtitle = $("#authSubtitle");
const confirmWrap = $("#confirmWrap");
const authForm = $("#authForm");
const authEmail = $("#authEmail");
const authPassword = $("#authPassword");
const authConfirm = $("#authConfirm");
const btnAuthPrimary = $("#btnAuthPrimary");
const btnAuthToggle = $("#btnAuthToggle");
const authMsg = $("#authMsg");

const btnLogout = $("#btnLogout");

const fab = $("#fab");
const modalOverlay = $("#modalOverlay");
const btnModalClose = $("#btnModalClose");
const txForm = $("#txForm");
const txDate = $("#txDate");
const txDesc = $("#txDesc");
const txAmount = $("#txAmount");
const txCategory = $("#txCategory");
const txNote = $("#txNote");
const btnAddCategory = $("#btnAddCategory");
const btnManageCategories = $("#btnManageCategories");
const addCatOverlay = $("#addCatOverlay");
const manageCatOverlay = $("#manageCatOverlay");
const btnAddCatClose = $("#btnAddCatClose");
const btnAddCatCancel = $("#btnAddCatCancel");
const btnManageCatClose = $("#btnManageCatClose");
const addCatForm = $("#addCatForm");
const addCatInput = $("#addCatInput");
const addCatMsg = $("#addCatMsg");
const manageCatList = $("#manageCatList");
const typeExpense = $("#typeExpense");
const typeIncome = $("#typeIncome");
const btnAddTx = $("#btnAddTx");
const txMsg = $("#txMsg");

const txList = $("#txList");
const emptyState = $("#emptyState");

const sumSpent = $("#sumSpent");
const sumEarned = $("#sumEarned");
const sumNet = $("#sumNet");

const toast = $("#toast");

let authMode = "login"; // "login" | "signup"
let txType = "expense"; // "expense" | "income"

const LS_KEYS = {
  session: "st_session",
  tx: "st_transactions_v1",
  categories: "st_categories_v1",
};

const DEFAULT_CATEGORIES = [
  "Food",
  "Coffee",
  "Groceries",
  "Transport",
  "Bills",
  "Rent",
  "Shopping",
  "Entertainment",
  "Health",
  "Other",
];

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.session) || "null");
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(LS_KEYS.session, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(LS_KEYS.session);
}

function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.tx) || "[]");
  } catch {
    return [];
  }
}

function saveTransactions(list) {
  localStorage.setItem(LS_KEYS.tx, JSON.stringify(list));
}

function loadCategories() {
  try {
    const list = JSON.parse(localStorage.getItem(LS_KEYS.categories) || "[]");
    return Array.isArray(list) && list.length ? list : [...DEFAULT_CATEGORIES];
  } catch {
    return [...DEFAULT_CATEGORIES];
  }
}

function saveCategories(list) {
  localStorage.setItem(LS_KEYS.categories, JSON.stringify(list));
}

function normalizeCategoryName(name) {
  return String(name || "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderCategoryOptions(selected = "") {
  const categories = loadCategories();
  txCategory.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = !selected;
  placeholder.textContent = "Select a category";
  txCategory.appendChild(placeholder);

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = `${categoryEmoji(cat)} ${cat}`;
    if (cat === selected) opt.selected = true;
    txCategory.appendChild(opt);
  });
}

function show(el) {
  el.classList.remove("hidden");
}
function hide(el) {
  el.classList.add("hidden");
}

function setAuthMode(mode) {
  authMode = mode;
  hide(authMsg);

  if (authMode === "login") {
    authTitle.textContent = "Sign in";
    authSubtitle.textContent = "Welcome back. Log in to see your data.";
    btnAuthPrimary.textContent = "Login";
    btnAuthToggle.textContent = "Sign up instead";
    hide(confirmWrap);
    authConfirm.value = "";
    authConfirm.required = false;
  } else {
    authTitle.textContent = "Create account";
    authSubtitle.textContent =
      "Sign up to sync your transactions across devices.";
    btnAuthPrimary.textContent = "Sign up";
    btnAuthToggle.textContent = "Login instead";
    show(confirmWrap);
    authConfirm.required = true;
  }
}

function setSignedInUI() {
  hide(authView);
  show(appView);
  show(fab);
  show(btnLogout); // show logout in header
  render();
}

function setSignedOutUI() {
  show(authView);
  hide(appView);
  hide(fab);
  hide(btnLogout); // hide logout in header
}

function openModal() {
  // Pre-fill
  txDate.value = todayISO();
  txDesc.value = "";
  txAmount.value = "";
  renderCategoryOptions("");
  txNote.value = "";
  setType("expense");
  hide(txMsg);

  modalOverlay.setAttribute("aria-hidden", "false");
  show(modalOverlay);

  // focus amount quickly
  setTimeout(() => txAmount.focus(), 50);
}

function closeModal() {
  modalOverlay.setAttribute("aria-hidden", "true");
  hide(modalOverlay);
  closeAllMenus();
  resetModalToAdd();
}

function setType(type) {
  txType = type;

  const isExpense = txType === "expense";

  typeExpense.classList.toggle("isActive", isExpense);
  typeIncome.classList.toggle("isActive", !isExpense);

  typeExpense.classList.toggle("isExpenseActive", isExpense);
  typeIncome.classList.toggle("isIncomeActive", !isExpense);

  typeExpense.classList.remove("isIncomeActive");
  typeIncome.classList.remove("isExpenseActive");

  typeExpense.setAttribute("aria-selected", isExpense ? "true" : "false");
  typeIncome.setAttribute("aria-selected", !isExpense ? "true" : "false");
}

function showToast(text, duration = 1800) {
  toast.textContent = text;
  show(toast);
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => hide(toast), duration);
}

function showInline(msg) {
  txMsg.textContent = msg;
  show(txMsg);
}

function showNote(note) {
  showToast(`Note: ${note}`, 3500);
}

function openAddCatModal() {
  addCatInput.value = "";
  hide(addCatMsg);
  addCatOverlay.setAttribute("aria-hidden", "false");
  show(addCatOverlay);
  setTimeout(() => addCatInput.focus(), 50);
}

function closeAddCatModal() {
  addCatOverlay.setAttribute("aria-hidden", "true");
  hide(addCatOverlay);
}

function renderManageCategories() {
  const categories = loadCategories();
  manageCatList.innerHTML = "";

  if (!categories.length) {
    const empty = document.createElement("div");
    empty.className = "emptyState";
    empty.textContent = "No categories yet.";
    manageCatList.appendChild(empty);
    return;
  }

  categories.forEach((cat) => {
    const item = document.createElement("div");
    item.className = "catItem";

    const meta = document.createElement("div");
    meta.className = "catMeta";

    const name = document.createElement("div");
    name.className = "catName";
    name.textContent = `${categoryEmoji(cat)} ${cat}`;

    const note = document.createElement("div");
    note.className = "catNote";
    note.textContent = "Deleting sets category to blank on old transactions.";

    meta.appendChild(name);
    meta.appendChild(note);

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn--danger btn--sm";
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteCategory(cat));

    item.appendChild(meta);
    item.appendChild(delBtn);
    manageCatList.appendChild(item);
  });
}

function openManageCatModal() {
  renderManageCategories();
  manageCatOverlay.setAttribute("aria-hidden", "false");
  show(manageCatOverlay);
}

function closeManageCatModal() {
  manageCatOverlay.setAttribute("aria-hidden", "true");
  hide(manageCatOverlay);
}

function deleteCategory(cat) {
  const categories = loadCategories();
  const updated = categories.filter(
    (c) => c.toLowerCase() !== cat.toLowerCase(),
  );
  saveCategories(updated);

  const items = loadTransactions().map((tx) =>
    tx.category?.toLowerCase() === cat.toLowerCase()
      ? { ...tx, category: "" }
      : tx,
  );
  saveTransactions(items);

  renderCategoryOptions("");
  renderManageCategories();
  render();
  showToast("Category deleted");
}

function categoryEmoji(cat) {
  const map = {
    Food: "🍔",
    Coffee: "☕",
    Groceries: "🛒",
    Transport: "🚗",
    Bills: "🧾",
    Rent: "🏠",
    Shopping: "🛍️",
    Entertainment: "🎮",
    Health: "🏥",
    Other: "🧩",
  };
  return map[cat] || "🧩";
}

function money(n) {
  const num = Number(n || 0);
  return `$${num.toFixed(2)}`;
}

function groupLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - that) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  // e.g. "Mon, Feb 10"
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function renderSummary(items) {
  let spent = 0;
  let earned = 0;

  // (UI prototype) compute on all items
  for (const it of items) {
    const amt = Number(it.amount || 0);
    if (it.type === "expense") spent += amt;
    else earned += amt;
  }

  const net = earned - spent;
  sumSpent.textContent = money(spent);
  sumEarned.textContent = money(earned);
  sumNet.textContent = money(net);
}

let editingId = null;

function formatRowDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function closeAllMenus() {
  document.querySelectorAll(".menu").forEach((m) => m.remove());
}

function renderList(items) {
  txList.innerHTML = "";

  if (!items.length) {
    show(emptyState);
    return;
  }
  hide(emptyState);

  const sorted = [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (a.createdAt || 0) < (b.createdAt || 0) ? 1 : -1;
  });

  for (const it of sorted) {
    const row = document.createElement("div");
    row.className = "txRow";
    row.dataset.id = it.id;

    // LEFT: Title + category
    const left = document.createElement("div");
    left.className = "txLeft";

    const title = document.createElement("div");
    title.className = "txTitle";
    title.textContent = it.desc?.trim()
      ? it.desc.trim()
      : it.category || "Transaction";

    const sub = document.createElement("div");
    sub.className = "txSub";
    sub.textContent = it.category || "Other";

    left.appendChild(title);
    left.appendChild(sub);

    // RIGHT: (amount + date) + kebab
    const right = document.createElement("div");
    right.className = "txRight";

    const metaRight = document.createElement("div");
    metaRight.className = "txMetaRight";

    const amt = document.createElement("div");
    amt.className = "txAmt " + (it.type === "expense" ? "expense" : "income");
    const sign = it.type === "expense" ? "-" : "+";
    amt.textContent = `${sign}${money(it.amount)}`;

    const date = document.createElement("div");
    date.className = "txDate";
    date.textContent = formatRowDate(it.date);

    metaRight.appendChild(amt);
    metaRight.appendChild(date);

    const kebabWrap = document.createElement("div");
    kebabWrap.className = "kebabWrap";

    const kebab = document.createElement("button");
    kebab.className = "kebab";
    kebab.type = "button";
    kebab.setAttribute("aria-label", "Transaction actions");
    kebab.textContent = "⋯";

    kebab.addEventListener("click", (e) => {
      e.stopPropagation();
      const existing = kebabWrap.querySelector(".menu");
      closeAllMenus();
      if (existing) return;

      const menu = document.createElement("div");
      menu.className = "menu";

      const btnEdit = document.createElement("button");
      btnEdit.className = "menuBtn";
      btnEdit.type = "button";
      btnEdit.textContent = "Edit";
      btnEdit.addEventListener("click", () => {
        closeAllMenus();
        startEdit(it.id);
      });

      const btnDel = document.createElement("button");
      btnDel.className = "menuBtn menuBtn--danger";
      btnDel.type = "button";
      btnDel.textContent = "Delete";
      btnDel.addEventListener("click", () => {
        closeAllMenus();
        deleteTx(it.id);
      });

      menu.appendChild(btnEdit);
      menu.appendChild(btnDel);
      kebabWrap.appendChild(menu);
    });

    kebabWrap.appendChild(kebab);

    right.appendChild(metaRight);
    right.appendChild(kebabWrap);

    const noteWrap = document.createElement("div");
    noteWrap.className = "txNoteWrap";
    if (it.note?.trim()) {
      const noteBtn = document.createElement("button");
      noteBtn.className = "txNoteBtn";
      noteBtn.type = "button";
      noteBtn.setAttribute("aria-label", "View note");
      noteBtn.setAttribute("title", "View note");
      noteBtn.textContent = "📝";
      noteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showNote(it.note.trim());
      });
      noteWrap.appendChild(noteBtn);
    }

    row.appendChild(left);
    row.appendChild(noteWrap);
    row.appendChild(right);

    txList.appendChild(row);
  }
}

function render() {
  const items = loadTransactions();
  renderSummary(items);
  renderList(items);
}

function startEdit(id) {
  const items = loadTransactions();
  const it = items.find((x) => x.id === id);
  if (!it) return;

  editingId = id;

  // fill modal
  txDate.value = it.date;
  txDesc.value = it.desc || "";
  txAmount.value = String(it.amount ?? "");
  renderCategoryOptions(it.category || "");
  txNote.value = it.note || "";
  setType(it.type || "expense");

  // change modal title + button text
  document.querySelector(".modal__title").textContent = "Edit transaction";
  document.querySelector(".modal__muted").textContent =
    "Update details, then save.";
  btnAddTx.textContent = "Save changes";

  hide(txMsg);
  modalOverlay.setAttribute("aria-hidden", "false");
  show(modalOverlay);
  validateTxForm();
}

function resetModalToAdd() {
  editingId = null;
  document.querySelector(".modal__title").textContent = "Add transaction";
  document.querySelector(".modal__muted").textContent =
    "Fast entry. You can edit later.";
  btnAddTx.textContent = "Add transaction";
}

function deleteTx(id) {
  const ok = confirm("Delete this transaction?");
  if (!ok) return;

  const items = loadTransactions().filter((x) => x.id !== id);
  saveTransactions(items);
  render();
  showToast("Transaction deleted");
}

/* ---------- Events ---------- */

// auth toggle
btnAuthToggle.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "signup" : "login");
});

// auth submit (UI-only)
authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  hide(authMsg);

  const email = authEmail.value.trim();
  const pass = authPassword.value;

  if (!email || !pass) {
    authMsg.textContent = "Please enter email + password.";
    show(authMsg);
    return;
  }

  if (authMode === "signup") {
    if (authConfirm.value !== pass) {
      authMsg.textContent = "Passwords do not match.";
      show(authMsg);
      return;
    }
  }

  // Fake "session"
  saveSession({ email });
  setSignedInUI();
  showToast(authMode === "signup" ? "Account created" : "Logged in");
});

// logout
btnLogout.addEventListener("click", () => {
  clearSession();
  setSignedOutUI();
  showToast("Logged out");
});

// modal open/close
fab.addEventListener("click", () => openModal());
btnModalClose.addEventListener("click", () => closeModal());

btnAddCategory.addEventListener("click", () => openAddCatModal());
btnManageCategories.addEventListener("click", () => openManageCatModal());
btnAddCatClose.addEventListener("click", () => closeAddCatModal());
btnAddCatCancel.addEventListener("click", () => closeAddCatModal());
btnManageCatClose.addEventListener("click", () => closeManageCatModal());

addCatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  hide(addCatMsg);

  const name = normalizeCategoryName(addCatInput.value);
  if (!name) {
    addCatMsg.textContent = "Please enter a category name.";
    show(addCatMsg);
    return;
  }

  const categories = loadCategories();
  const exists = categories.some((c) => c.toLowerCase() === name.toLowerCase());
  if (exists) {
    addCatMsg.textContent = "That category already exists.";
    show(addCatMsg);
    return;
  }

  categories.push(name);
  saveCategories(categories);
  renderCategoryOptions(name);
  closeAddCatModal();
  showToast("Category added");
});

// click outside modal closes
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    closeAllMenus();
    closeModal();
  }
});

addCatOverlay.addEventListener("click", (e) => {
  if (e.target === addCatOverlay) {
    closeAddCatModal();
  }
});

manageCatOverlay.addEventListener("click", (e) => {
  if (e.target === manageCatOverlay) {
    closeManageCatModal();
  }
});

// esc closes
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllMenus();
    if (!modalOverlay.classList.contains("hidden")) closeModal();
    if (!addCatOverlay.classList.contains("hidden")) closeAddCatModal();
    if (!manageCatOverlay.classList.contains("hidden")) closeManageCatModal();
  }
});

document.addEventListener("click", () => closeAllMenus());

// type toggle
typeExpense.addEventListener("click", () => setType("expense"));
typeIncome.addEventListener("click", () => setType("income"));

// enable/disable add button based on category + amount
function validateTxForm() {
  const amtOK = Number(txAmount.value) > 0;
  const catOK = !!txCategory.value;
  btnAddTx.disabled = !(amtOK && catOK);
}
["input", "change"].forEach((ev) => {
  txAmount.addEventListener(ev, validateTxForm);
  txCategory.addEventListener(ev, validateTxForm);
  txDate.addEventListener(ev, validateTxForm);
  txDesc.addEventListener(ev, validateTxForm);
});

// add transaction
txForm.addEventListener("submit", (e) => {
  e.preventDefault();
  hide(txMsg);

  const date = txDate.value;
  const desc = txDesc.value.trim();
  const amount = Number(txAmount.value);
  const category = txCategory.value;
  const note = txNote.value.trim();

  if (!date) return showInline("Pick a date.");
  if (!category) return showInline("Pick a category.");
  if (!(amount > 0)) return showInline("Amount must be > 0.");

  const items = loadTransactions();

  if (editingId) {
    const idx = items.findIndex((x) => x.id === editingId);
    if (idx !== -1) {
      items[idx] = {
        ...items[idx],
        date,
        type: txType,
        desc,
        amount,
        category,
        note,
      };
    }
    saveTransactions(items);
    render();
    closeModal();
    showToast("Transaction updated");
    return;
  }

  // add new
  items.push({
    id: crypto?.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2),
    date,
    type: txType,
    desc,
    amount,
    category,
    note,
    createdAt: Date.now(),
  });

  saveTransactions(items);
  render();
  closeModal();
  showToast("Transaction added");
});

/* ---------- Init ---------- */
renderCategoryOptions("");
setAuthMode("login");

const session = loadSession();
if (session?.email) {
  setSignedInUI();
} else {
  setSignedOutUI();
  hide(fab);
}

// Set initial modal defaults
txDate.value = todayISO();
validateTxForm();

/* ==========================================================================
   BookVault Frontend Core (app.js)
   - Cliente HTTP apiFetch hacia la API REST (/api/*)
   - Control del menú lateral / menú hamburguesa responsivo
   - Sistema de mensajes flash entre navegaciones
   - Motor de validaciones de frontend (formatos y protección al usuario)
   ========================================================================== */

const API_BASE_URL = '/api';

function buildQueryString(params = {}) {
  const search = new window.URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) {
      return;
    }
    search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

/**
 * Ejecuta una petición JSON contra la API REST de BookVault.
 * Parsea los mensajes de error { error: { message } } del backend y maneja 204.
 */
async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const serverMessage =
      data && data.error && data.error.message
        ? data.error.message
        : `Error de comunicación con el servidor (HTTP ${response.status})`;
    const error = new Error(serverMessage);
    error.status = response.status;
    throw error;
  }

  return data;
}

const FLASH_STORAGE_KEY = 'bookvault_flash_message';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getQueryParam(name) {
  const params = new window.URLSearchParams(window.location.search);
  return params.get(name);
}

function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysISO(baseIso, days) {
  const [year, month, day] = baseIso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  const parts = String(isoDate).slice(0, 10).split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function setFlash(type, message) {
  try {
    window.sessionStorage.setItem(
      FLASH_STORAGE_KEY,
      JSON.stringify({ type, message }),
    );
  } catch {
    // Ignorar si sessionStorage no está disponible
  }
}

function consumeFlash() {
  try {
    const raw = window.sessionStorage.getItem(FLASH_STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(FLASH_STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function showAlert(container, type, message) {
  if (!container || !message) return;
  const safeType = ['success', 'danger', 'warning', 'info'].includes(type)
    ? type
    : 'info';

  container.innerHTML = `
    <div class="alert alert-${safeType}" role="status" aria-live="polite">
      <span>${escapeHtml(message)}</span>
      <button type="button" class="alert-dismiss" aria-label="Cerrar notificación">&times;</button>
    </div>
  `;

  const closeBtn = container.querySelector('.alert-dismiss');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      container.innerHTML = '';
    });
  }
}

function clearAlert(container) {
  if (container) {
    container.innerHTML = '';
  }
}

function renderFlash(containerId = 'flash-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const flash = consumeFlash();
  if (flash) {
    showAlert(container, flash.type, flash.message);
  }
}

function getErrorMessage(error, fallback = 'Ocurrió un error al procesar la solicitud.') {
  if (error && error.message) {
    return error.message;
  }
  return fallback;
}

/* --------------------------------------------------------------------------
   Navegación responsiva (Sidebar escritorio + Hamburguesa móvil)
   -------------------------------------------------------------------------- */
function initNavigation() {
  const toggleBtn = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (!toggleBtn || !sidebar) return;

  function closeMenu() {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Abrir menú de navegación');
  }

  function openMenu() {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Cerrar menú de navegación');
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (backdrop) {
    backdrop.addEventListener('click', closeMenu);
  }

  sidebar.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar.classList.contains('open')) {
      closeMenu();
      toggleBtn.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      closeMenu();
    }
  });
}

/* --------------------------------------------------------------------------
   Motor de validaciones de frontend (formatos, requeridos, rangos de UI)
   -------------------------------------------------------------------------- */
function getErrorElement(input) {
  if (!input || !input.id) return null;
  return document.getElementById(`${input.id}-error`);
}

function setFieldError(input, message) {
  if (!input) return;
  input.classList.add('is-invalid');
  input.classList.remove('is-valid');
  input.setAttribute('aria-invalid', 'true');

  const errorEl = getErrorElement(input);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

function clearFieldError(input, markValid = false) {
  if (!input) return;
  input.classList.remove('is-invalid');
  input.removeAttribute('aria-invalid');
  if (markValid) {
    input.classList.add('is-valid');
  } else {
    input.classList.remove('is-valid');
  }

  const errorEl = getErrorElement(input);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
}

function validateField(input, validatorFn) {
  if (!input || typeof validatorFn !== 'function') return true;
  const errorMessage = validatorFn(input.value, input);
  if (errorMessage) {
    setFieldError(input, errorMessage);
    return false;
  }
  const hasValue =
    input.type === 'checkbox'
      ? input.checked
      : String(input.value || '').trim().length > 0;
  clearFieldError(input, hasValue);
  return true;
}

function bindFormValidation(form, fieldValidators, onValidSubmit) {
  if (!form) return;

  const entries = Object.entries(fieldValidators);

  entries.forEach(([fieldId, validatorFn]) => {
    const input = form.querySelector(`#${fieldId}`);
    if (!input) return;

    const eventName =
      input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'date'
        ? 'change'
        : 'input';

    input.addEventListener('blur', () => {
      input.dataset.touched = 'true';
      validateField(input, validatorFn);
    });

    input.addEventListener(eventName, () => {
      if (input.dataset.touched === 'true' || input.classList.contains('is-invalid')) {
        validateField(input, validatorFn);
      }
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    let firstInvalid = null;
    let isValid = true;

    entries.forEach(([fieldId, validatorFn]) => {
      const input = form.querySelector(`#${fieldId}`);
      if (!input) return;
      input.dataset.touched = 'true';
      const fieldOk = validateField(input, validatorFn);
      if (!fieldOk) {
        isValid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    if (!isValid) {
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    await onValidSubmit(event);
  });
}

const Validators = {
  isNotBlank(value) {
    return String(value ?? '').trim().length > 0;
  },

  lengthBetween(value, min, max) {
    const len = String(value ?? '').trim().length;
    return len >= min && len <= max;
  },

  isValidPersonName(value) {
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'.\-\s]+$/.test(String(value ?? '').trim());
  },

  isValidISBN(value) {
    const raw = String(value ?? '').trim();
    if (!/^[0-9Xx\-\s]+$/.test(raw)) return false;
    const compact = raw.replace(/[-\s]/g, '');
    return /^(?:\d{9}[\dXx]|\d{13})$/.test(compact);
  },

  isValidYear(value, minYear = 1000, maxYear = new Date().getFullYear()) {
    const str = String(value ?? '').trim();
    if (!/^\d{4}$/.test(str)) return false;
    const num = Number(str);
    return Number.isInteger(num) && num >= minYear && num <= maxYear;
  },

  isPositiveInteger(value, min = 1, max = 9999) {
    const str = String(value ?? '').trim();
    if (!/^\d+$/.test(str)) return false;
    const num = Number(str);
    return Number.isInteger(num) && num >= min && num <= max;
  },

  isValidCedula(value) {
    return /^\d{6,15}$/.test(String(value ?? '').trim());
  },

  isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? '').trim());
  },

  isValidPhone(value) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return true;
    return /^[+\d][\d\s\-()]{6,19}$/.test(trimmed);
  },

  isValidDate(value) {
    const str = String(value ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
    const [year, month, day] = str.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  },
};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  renderFlash();
});

window.BookVaultApi = { apiFetch, buildQueryString };
window.BookVaultUI = {
  escapeHtml,
  getQueryParam,
  getTodayISO,
  addDaysISO,
  formatDate,
  setFlash,
  showAlert,
  clearAlert,
  renderFlash,
  getErrorMessage,
};
window.BookVaultValidation = {
  setFieldError,
  clearFieldError,
  validateField,
  bindFormValidation,
  Validators,
};

const API_BASE_URL = '/api';

/**
 * Make a JSON request to the BookVault API.
 * UI actions can build on this helper once the API operations are implemented.
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

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

// TODO: Add UI actions for listing, creating, editing, and removing records.
window.BookVaultApi = { apiFetch };

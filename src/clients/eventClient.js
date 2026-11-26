const { EVENT_MANAGER_URL, EVENT_SOURCE } = require('../config/env');

const EVENT_TIMEOUT_MS = 3000;

/**
 * Envía un evento de auditoría al Event Manager externo de forma resiliente
 * (RN-11 y RN-12). Nunca lanza excepciones para no interrumpir la operación
 * principal de la biblioteca.
 *
 * @param {Object} event
 * @param {'category' | 'author' | 'book' | 'client' | 'loan'} event.entity
 * @param {'QUERY' | 'CREATE' | 'UPDATE' | 'DELETE'} event.action
 * @param {string} event.title
 * @param {string} event.description
 * @param {Object} [event.payload={}]
 * @returns {Promise<boolean>}
 */
async function sendEvent({ entity, action, title, description, payload = {} }) {
  const endpoint = `${EVENT_MANAGER_URL.replace(/\/+$/, '')}/events`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: EVENT_SOURCE,
        entity,
        action,
        title,
        description,
        payload,
      }),
      signal: AbortSignal.timeout(EVENT_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(
        `[EventClient] Event Manager respondió HTTP ${response.status} para ${entity}.${action} (${endpoint})`,
      );
      return false;
    }

    return true;
  } catch (error) {
    const reason = error && error.message ? error.message : String(error);
    console.warn(
      `[EventClient] No se pudo notificar ${entity}.${action} a ${endpoint}: ${reason}`,
    );
    return false;
  }
}

module.exports = { sendEvent };

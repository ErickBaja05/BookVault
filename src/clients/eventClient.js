const { EVENT_MANAGER_URL, EVENT_SOURCE } = require('../config/env');

/**
 * Send a best-effort event to the Event Manager.
 *
 * @param {Object} event
 * @param {string} event.entity Entity that emitted the event.
 * @param {'QUERY' | 'CREATE' | 'UPDATE' | 'DELETE'} event.action Event action.
 * @param {string} event.title Short event title.
 * @param {string} event.description Event description.
 * @param {Object} [event.payload={}] Event-specific data.
 * @returns {Promise<boolean>} Whether the Event Manager accepted the event.
 */
async function sendEvent({ entity, action, title, description, payload = {} }) {
  try {
    const response = await fetch(
      `${EVENT_MANAGER_URL.replace(/\/+$/, '')}/events`,
      {
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
        signal: AbortSignal.timeout(3000),
      },
    );

    return response.ok;
  } catch {
    return false;
  }
}

module.exports = { sendEvent };

function cleanupExpiredEntries(store, currentTime) {
  for (const [key, value] of store.entries()) {
    if (value.expiresAt <= currentTime) {
      store.delete(key);
    }
  }
}

export function createMenuEventGuard({
  now = () => Date.now(),
  throttleWindowMs = 5_000,
  eventTtlMs = 10 * 60_000
} = {}) {
  const processedEvents = new Map();
  const throttledUsers = new Map();

  function cleanup(currentTime) {
    cleanupExpiredEntries(processedEvents, currentTime);
    cleanupExpiredEntries(throttledUsers, currentTime);
  }

  return {
    reserve({ eventId = "", openId = "", eventKey = "" }) {
      const currentTime = now();
      cleanup(currentTime);

      if (eventId) {
        const existingEvent = processedEvents.get(eventId);
        if (existingEvent) {
          return {
            allowed: false,
            reason: "duplicate_event"
          };
        }
      }

      const throttleKey = openId && eventKey ? `${openId}:${eventKey}` : "";
      if (throttleKey) {
        const existingThrottle = throttledUsers.get(throttleKey);
        if (existingThrottle) {
          return {
            allowed: false,
            reason: "throttled"
          };
        }
      }

      const reservation = {
        eventId,
        throttleKey
      };

      if (eventId) {
        processedEvents.set(eventId, {
          expiresAt: currentTime + eventTtlMs
        });
      }

      if (throttleKey) {
        throttledUsers.set(throttleKey, {
          expiresAt: currentTime + throttleWindowMs
        });
      }

      return {
        allowed: true,
        reservation
      };
    },

    release(reservation) {
      if (!reservation) {
        return;
      }

      if (reservation.eventId) {
        processedEvents.delete(reservation.eventId);
      }

      if (reservation.throttleKey) {
        throttledUsers.delete(reservation.throttleKey);
      }
    }
  };
}

type Listener = () => void;

const listeners = new Set<Listener>();

/** Pub/sub the global 401 interceptor publishes into. Subscribers (e.g. the
 * root auth provider) clear query cache and redirect to /login. */
export function onUnauthorized(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyUnauthorized() {
  listeners.forEach((listener) => listener());
}

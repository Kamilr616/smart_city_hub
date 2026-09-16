export function normalizeApiUrl(value = '') {
  const root = value.trim().replace(/\/+$/, '');
  return root.endsWith('/api') ? root : `${root}/api`;
}

const unauthorizedListeners = new Set();

export function subscribeUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export function getApiErrorMessage(error) {
  if (error?.code === 'VALIDATION') return error.message;
  if (error?.code === 'TIMEOUT')
    return 'Serwer nie odpowiedział na czas. Spróbuj ponownie.';
  if (error?.status === 401) return 'Sesja wygasła. Zaloguj się ponownie.';
  if (error?.status === 403)
    return 'Nie masz uprawnień do wykonania tej operacji.';
  if (error?.status === 404) return 'Nie znaleziono danych.';
  if (error?.status === 409)
    return 'Dane już istnieją. Sprawdź identyfikator lub adres e-mail.';
  if (error?.status === 400) return 'Sprawdź poprawność wprowadzonych danych.';
  return 'Nie udało się połączyć z serwerem lub pobrać danych. Spróbuj ponownie.';
}

// Plain objects and arrays become JSON; strings and browser body types pass through.
export async function apiRequest(
  path,
  { token, signal, timeoutMs = 15000, body, headers, ...options } = {},
) {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted)
    throw new DOMException('Request cancelled', 'AbortError');
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(
    () => {
      timedOut = true;
      controller.abort();
    },
    Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000,
  );
  try {
    const requestHeaders = new Headers(headers);
    requestHeaders.set('Accept', 'application/json');
    if (token) requestHeaders.set('Authorization', 'Bearer ' + token);
    const isJson =
      body !== null &&
      typeof body === 'object' &&
      (Array.isArray(body) || Object.getPrototypeOf(body) === Object.prototype);
    if (isJson || typeof body === 'string') {
      if (!requestHeaders.has('Content-Type'))
        requestHeaders.set('Content-Type', 'application/json');
    }
    const response = await fetch(
      normalizeApiUrl(import.meta.env?.VITE_API_URL) +
        '/' +
        path.replace(/^\/+/, ''),
      {
        ...options,
        headers: requestHeaders,
        body: isJson ? JSON.stringify(body) : body,
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      if (response.status === 401 && token)
        unauthorizedListeners.forEach((listener) => listener(token));
      throw Object.assign(new Error('API request failed'), {
        status: response.status,
      });
    }
    const content = await response.text();
    return content ? JSON.parse(content) : null;
  } catch (error) {
    if (timedOut)
      throw Object.assign(new Error('Request timed out'), { code: 'TIMEOUT' });
    if (controller.signal.aborted)
      throw new DOMException('Request cancelled', 'AbortError');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

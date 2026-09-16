import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiRequest, getApiErrorMessage } from '../api';
import { UserContext } from '../context/auth';

const dateLabel = (value) => new Date(value).toLocaleString('pl-PL');

export default function EspTokens() {
  const { user } = useContext(UserContext);
  const {
    devices = [],
    sensors = [],
    loading: inventoryLoading,
    errors = {},
  } = useOutletContext();
  const [keys, setKeys] = useState([]);
  const [form, setForm] = useState({
    name: '',
    location: '',
    expiresInDays: '30',
  });
  const [secret, setSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const mutation = useRef(null);
  const listRequest = useRef(null);
  const locations = [
    ...new Set(
      [...devices, ...sensors]
        .map((item) => item.location)
        .filter(
          (location) =>
            typeof location === 'string' &&
            location.trim() &&
            !['admin', '*'].includes(location.toLowerCase()),
        ),
    ),
  ].sort();
  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin');
  const inventoryFailed = Boolean(errors.devices || errors.sensors);

  const refresh = useCallback(async () => {
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/esp-tokens', {
        token: user.token,
        signal: controller.signal,
      });
      if (!Array.isArray(result)) throw new Error('Invalid token list');
      if (!controller.signal.aborted) setKeys(result);
    } catch (failure) {
      if (failure.name !== 'AbortError') setError(getApiErrorMessage(failure));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [user.token]);

  useEffect(() => {
    if (isAdmin) refresh();
    return () => {
      listRequest.current?.abort();
      mutation.current?.abort();
    };
  }, [isAdmin, refresh]);

  async function create(event) {
    event.preventDefault();
    if (mutation.current) return;
    const days = Number(form.expiresInDays);
    if (
      !form.name.trim() ||
      !locations.includes(form.location) ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 365
    ) {
      setError('Podaj nazwę, wybierz lokalizację i ważność od 1 do 365 dni.');
      return;
    }
    const controller = new AbortController();
    mutation.current = controller;
    setPending(true);
    setError('');
    setMessage('');
    setSecret(null);
    try {
      const result = await apiRequest('/esp-tokens', {
        method: 'POST',
        token: user.token,
        signal: controller.signal,
        body: {
          name: form.name.trim(),
          location: form.location,
          expiresInDays: days,
        },
      });
      if (controller.signal.aborted) return;
      setSecret({ token: result.token, id: result.key.id });
      setKeys((previous) => [result.key, ...previous]);
      setForm((previous) => ({ ...previous, name: '' }));
      setMessage(
        'Token został utworzony. Skopiuj go przed zamknięciem tego widoku.',
      );
    } catch (failure) {
      if (failure.name !== 'AbortError') setError(getApiErrorMessage(failure));
    } finally {
      mutation.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  async function revoke(key) {
    if (
      mutation.current ||
      !window.confirm('Unieważnić token „' + key.name + '”? ESP utraci dostęp.')
    )
      return;
    const controller = new AbortController();
    mutation.current = controller;
    setPending(true);
    setError('');
    setMessage('');
    try {
      const result = await apiRequest('/esp-tokens/' + key.id, {
        method: 'DELETE',
        token: user.token,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setKeys((previous) =>
        previous.map((item) => (item.id === key.id ? result : item)),
      );
      setSecret((previous) => (previous?.id === key.id ? null : previous));
      setMessage('Token został unieważniony.');
    } catch (failure) {
      if (failure.name !== 'AbortError') setError(getApiErrorMessage(failure));
    } finally {
      mutation.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage('Skopiowano do schowka.');
    } catch {
      setError('Nie udało się skopiować. Zaznacz tekst i skopiuj go ręcznie.');
    }
  }

  if (!isAdmin)
    return (
      <p role="alert" className="error-message">
        Brak uprawnień administratora.
      </p>
    );
  const snippet = secret
    ? '#define API_TOKEN "Bearer ' + secret.token + '"'
    : '';
  return (
    <>
      <div className="page-heading">
        <h1>Tokeny ESP</h1>
        <button
          className="button button-secondary"
          onClick={refresh}
          disabled={loading || pending}
        >
          Odśwież
        </button>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      <section className="form-panel" aria-labelledby="esp-create-title">
        <h2 id="esp-create-title">Nowy token</h2>
        <p>Odczyt stanów i zapis pomiarów tylko w wybranej lokalizacji.</p>
        <form className="form-grid" onSubmit={create} aria-busy={pending}>
          <label className="field">
            <span>Nazwa tokenu</span>
            <input
              required
              maxLength={120}
              value={form.name}
              disabled={pending}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </label>
          <div className="field">
            <label htmlFor="esp-location">Lokalizacja</label>
            <select
              id="esp-location"
              required
              value={form.location}
              disabled={pending || inventoryLoading || inventoryFailed}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
            >
              <option value="">Wybierz lokalizację</option>
              {locations.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
          </div>
          <label className="field">
            <span>Ważność (dni)</span>
            <input
              type="number"
              min="1"
              max="365"
              step="1"
              required
              value={form.expiresInDays}
              disabled={pending}
              onChange={(event) =>
                setForm({ ...form, expiresInDays: event.target.value })
              }
            />
          </label>
          {inventoryFailed && (
            <p role="alert" className="error-message">
              Nie można pobrać lokalizacji. Odśwież stronę i spróbuj ponownie.
            </p>
          )}
          {!inventoryLoading && !inventoryFailed && !locations.length && (
            <p>
              Dodaj urządzenie lub czujnik z lokalizacją przed utworzeniem
              tokenu.
            </p>
          )}
          <button
            className="button"
            type="submit"
            disabled={
              pending ||
              loading ||
              inventoryLoading ||
              inventoryFailed ||
              !locations.length
            }
          >
            {pending ? 'Zapisywanie…' : 'Generuj token'}
          </button>
        </form>
      </section>
      {secret && (
        <section
          className="form-panel esp-secret"
          aria-labelledby="esp-secret-title"
        >
          <h2 id="esp-secret-title">Token utworzony</h2>
          <p>
            Pełny token jest widoczny tylko teraz. Zapisz go w lokalnym pliku
            secrets.h.
          </p>
          <div className="field">
            <label htmlFor="esp-secret">Nowy token ESP</label>
            <textarea
              id="esp-secret"
              readOnly
              rows="3"
              value={secret.token}
              spellCheck={false}
            />
          </div>
          <div className="actions">
            <button
              className="button button-secondary"
              onClick={() => copy(secret.token)}
            >
              Kopiuj token
            </button>
          </div>
          <div className="field">
            <label htmlFor="esp-firmware">Ustawienie firmware</label>
            <textarea
              id="esp-firmware"
              readOnly
              rows="3"
              value={snippet}
              spellCheck={false}
            />
          </div>
          <div className="actions">
            <button
              className="button button-secondary"
              onClick={() => copy(snippet)}
            >
              Kopiuj API_TOKEN
            </button>
            <button
              className="button button-secondary"
              onClick={() => {
                setSecret(null);
                setMessage('');
              }}
            >
              Zamknij token
            </button>
          </div>
        </section>
      )}
      <section className="panel" aria-label="Lista tokenów ESP">
        <div className="table-wrap">
          <table className="data-table admin-table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Lokalizacja</th>
                <th>Utworzono</th>
                <th>Wygasa</th>
                <th>Status</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const expired = new Date(key.expiresAt).getTime() <= Date.now();
                return (
                  <tr key={key.id}>
                    <td>{key.name}</td>
                    <td>{key.location}</td>
                    <td>{dateLabel(key.createdAt)}</td>
                    <td>{dateLabel(key.expiresAt)}</td>
                    <td>
                      <span
                        className={
                          'badge ' +
                          (key.revokedAt || expired ? 'badge-off' : 'badge-on')
                        }
                      >
                        {key.revokedAt
                          ? 'Unieważniony'
                          : expired
                            ? 'Wygasły'
                            : 'Aktywny'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="delete-button"
                        disabled={pending || loading || Boolean(key.revokedAt)}
                        aria-label={'Unieważnij: ' + key.name}
                        onClick={() => revoke(key)}
                      >
                        Unieważnij
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!keys.length && (
          <p className="empty-state">
            {loading ? 'Pobieranie tokenów…' : 'Brak tokenów ESP.'}
          </p>
        )}
      </section>
    </>
  );
}

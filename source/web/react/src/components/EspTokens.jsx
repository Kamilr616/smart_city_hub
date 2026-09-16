import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiRequest, getApiErrorMessage } from '../api';
import { UserContext } from '../context/auth';

const dateLabel = (value) => new Date(value).toLocaleString('en-GB');

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
      setError('Enter a name, select a location and set a validity period of 1 to 365 days.');
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
        'The token has been created. Copy it before closing this view.',
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
      !window.confirm('Revoke token “' + key.name + '”? The ESP device will lose access.')
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
      setMessage('The token has been revoked.');
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
      setMessage('Copied to clipboard.');
    } catch {
      setError('Could not copy. Select the text and copy it manually.');
    }
  }

  if (!isAdmin)
    return (
      <p role="alert" className="error-message">
        Administrator access required.
      </p>
    );
  const snippet = secret
    ? '#define API_TOKEN "Bearer ' + secret.token + '"'
    : '';
  return (
    <>
      <div className="page-heading">
        <h1>ESP tokens</h1>
        <button
          className="button button-secondary"
          onClick={refresh}
          disabled={loading || pending}
        >
          Refresh
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
        <h2 id="esp-create-title">New token</h2>
        <p>Read states and submit readings only for the selected location.</p>
        <form className="form-grid" onSubmit={create} aria-busy={pending}>
          <label className="field">
            <span>Token name</span>
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
            <label htmlFor="esp-location">Location</label>
            <select
              id="esp-location"
              required
              value={form.location}
              disabled={pending || inventoryLoading || inventoryFailed}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
          </div>
          <label className="field">
            <span>Validity (days)</span>
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
              Could not load locations. Refresh the page and try again.
            </p>
          )}
          {!inventoryLoading && !inventoryFailed && !locations.length && (
            <p>
              Add a device or sensor with a location before creating a
              token.
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
            {pending ? 'Saving…' : 'Generate token'}
          </button>
        </form>
      </section>
      {secret && (
        <section
          className="form-panel esp-secret"
          aria-labelledby="esp-secret-title"
        >
          <h2 id="esp-secret-title">Token created</h2>
          <p>
            The full token is only visible now. Save it in your local
            secrets.h file.
          </p>
          <div className="field">
            <label htmlFor="esp-secret">New ESP token</label>
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
              Copy token
            </button>
          </div>
          <div className="field">
            <label htmlFor="esp-firmware">Firmware setting</label>
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
              Copy API_TOKEN
            </button>
            <button
              className="button button-secondary"
              onClick={() => {
                setSecret(null);
                setMessage('');
              }}
            >
              Close token
            </button>
          </div>
        </section>
      )}
      <section className="panel" aria-label="ESP token list">
        <div className="table-wrap">
          <table className="data-table admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
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
                          ? 'Revoked'
                          : expired
                            ? 'Expired'
                            : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="delete-button"
                        disabled={pending || loading || Boolean(key.revokedAt)}
                        aria-label={'Revoke: ' + key.name}
                        onClick={() => revoke(key)}
                      >
                        Revoke
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
            {loading ? 'Loading tokens…' : 'No ESP tokens.'}
          </p>
        )}
      </section>
    </>
  );
}

import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { UserContext } from '../context/auth';
import { apiRequest, getApiErrorMessage } from '../api';

function Editor({ device, onSaved }) {
  const { user } = useContext(UserContext);
  const [form, setForm] = useState({
    name: device.name || '',
    location: device.location || '',
    type: device.type || '',
    description: device.description || '',
  });
  const [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const change = (e) =>
    setForm((previous) => ({ ...previous, [e.target.name]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError('');
    setSuccess('');
    try {
      const body = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()]),
      );
      await apiRequest('/device/' + device.deviceId, {
        method: 'PATCH',
        token: user.token,
        body,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      await onSaved();
      setSuccess('Zmiany zostały zapisane.');
    } catch (failure) {
      if (failure.name !== 'AbortError') setError(getApiErrorMessage(failure));
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }
  return (
    <form onSubmit={submit} aria-busy={pending}>
      <div className="field">
        <label htmlFor="edit-device-id">ID urządzenia</label>
        <input id="edit-device-id" value={device.deviceId} readOnly />
      </div>
      {[
        ['name', 'Nazwa urządzenia', 100],
        ['location', 'Lokalizacja', 100],
        ['type', 'Typ urządzenia', 100],
      ].map(([name, label, max]) => (
        <div className="field" key={name}>
          <label htmlFor={'edit-device-' + name}>{label}</label>
          <input
            id={'edit-device-' + name}
            name={name}
            value={form[name]}
            onChange={change}
            required
            maxLength={max}
            disabled={pending}
          />
        </div>
      ))}
      <div className="field">
        <label htmlFor="edit-device-description">Opis</label>
        <textarea
          id="edit-device-description"
          name="description"
          value={form.description}
          onChange={change}
          maxLength={1000}
          disabled={pending}
        />
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}
      <div className="actions">
        <button className="button" disabled={pending}>
          {pending ? 'Zapisywanie…' : 'Zapisz zmiany'}
        </button>
        <Link className="button button-secondary" to="/devices">
          Wróć do urządzeń
        </Link>
      </div>
    </form>
  );
}
Editor.propTypes = {
  device: PropTypes.object.isRequired,
  onSaved: PropTypes.func.isRequired,
};
export default function DeviceEdit() {
  const { deviceId } = useParams();
  const { user } = useContext(UserContext);
  const { refresh } = useOutletContext();
  const [result, setResult] = useState({
    device: null,
    loading: true,
    error: '',
  });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult({ device: null, loading: true, error: '' });
    apiRequest('/device/' + encodeURIComponent(deviceId), {
      token: user.token,
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        const device = Array.isArray(data)
          ? data.find((d) => String(d.deviceId) === deviceId)
          : null;
        setResult({
          device,
          loading: false,
          error: device ? '' : 'Nie znaleziono urządzenia.',
        });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({
            device: null,
            loading: false,
            error: getApiErrorMessage(error),
          });
      });
    return () => controller.abort();
  }, [deviceId, user.token, retry]);
  return (
    <section className="form-panel">
      <h1>Edytuj urządzenie</h1>
      <p>ID i historia stanów pozostają bez zmian.</p>
      {result.loading && <p role="status">Pobieranie urządzenia…</p>}
      {result.error && (
        <>
          <p role="alert" className="error-message">
            {result.error}
          </p>
          <button
            className="button button-secondary"
            onClick={() => setRetry((n) => n + 1)}
          >
            Ponów
          </button>
        </>
      )}
      {result.device && (
        <Editor
          key={result.device.deviceId}
          device={result.device}
          onSaved={refresh}
        />
      )}
    </section>
  );
}

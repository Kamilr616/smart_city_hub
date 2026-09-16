import { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { UserContext } from './context/auth';
import { apiRequest, getApiErrorMessage } from './api';
import { devicePayload } from './context/session';

const empty = {
  deviceId: '',
  location: '',
  name: '',
  type: '',
  description: '',
};

export default function AddDevice({ onSaved }) {
  const { user } = useContext(UserContext);
  const [form, setForm] = useState(empty);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);

  const change = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    setError('');
    setSuccess('');
    let body;
    try {
      body = devicePayload(form, []);
    } catch (failure) {
      setError(getApiErrorMessage(failure));
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    try {
      const existing = await apiRequest('/device/' + body.deviceId, {
        token: user.token,
        signal: controller.signal,
      });
      body = devicePayload(form, existing);
      const saved = await apiRequest('/device/update', {
        method: 'POST',
        token: user.token,
        body,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setForm(empty);
      setSuccess('Urządzenie zostało dodane.');
      onSaved?.(saved);
    } catch (failure) {
      if (failure.name !== 'AbortError') setError(getApiErrorMessage(failure));
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return (
    <section className="form-panel" aria-labelledby="device-form-title">
      <p className="eyebrow">Konfiguracja miasta</p>
      <h1 id="device-form-title">Dodaj urządzenie</h1>
      <p>Wybierz wolny identyfikator i przypisz urządzenie do lokalizacji.</p>
      <form onSubmit={submit} className="form-grid" aria-busy={pending}>
        <div className="field">
          <label htmlFor="deviceId">Identyfikator urządzenia (0–95)</label>
          <input
            className="input"
            id="deviceId"
            name="deviceId"
            type="number"
            min="0"
            max="95"
            step="1"
            required
            disabled={pending}
            value={form.deviceId}
            onChange={change}
          />
        </div>
        <div className="field">
          <label htmlFor="device-name">Nazwa urządzenia</label>
          <input
            className="input"
            id="device-name"
            name="name"
            required
            disabled={pending}
            value={form.name}
            onChange={change}
            placeholder="np. Oświetlenie rynku"
          />
        </div>
        <div className="field">
          <label htmlFor="device-location">Lokalizacja</label>
          <input
            className="input"
            id="device-location"
            name="location"
            required
            disabled={pending}
            value={form.location}
            onChange={change}
            placeholder="np. house1"
          />
        </div>
        <div className="field">
          <label htmlFor="device-type">Typ urządzenia</label>
          <input
            className="input"
            id="device-type"
            name="type"
            required
            disabled={pending}
            value={form.type}
            onChange={change}
            placeholder="np. light"
          />
        </div>
        <div className="field">
          <label htmlFor="device-description">Opis (opcjonalnie)</label>
          <textarea
            className="input"
            id="device-description"
            name="description"
            rows="3"
            disabled={pending}
            value={form.description}
            onChange={change}
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
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Zapisywanie…' : 'Dodaj urządzenie'}
        </button>
      </form>
    </section>
  );
}

AddDevice.propTypes = { onSaved: PropTypes.func };

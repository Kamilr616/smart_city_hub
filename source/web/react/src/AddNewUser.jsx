import { useContext, useEffect, useRef, useState } from 'react';
import { UserContext } from './context/auth';
import { apiRequest, getApiErrorMessage } from './api';
import { userPayload } from './context/session';

const empty = {
  name: '',
  email: '',
  role: '',
  password: '',
  confirmPassword: '',
};

export default function AddNewUser() {
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
      body = userPayload(form);
    } catch (failure) {
      setError(getApiErrorMessage(failure));
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    try {
      await apiRequest('/user/create', {
        method: 'POST',
        token: user.token,
        body,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setForm(empty);
      setSuccess('The user account has been created.');
    } catch (failure) {
      if (failure.name !== 'AbortError') setError(getApiErrorMessage(failure));
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return (
    <section className="form-panel" aria-labelledby="user-form-title">
      <h1 id="user-form-title">Add user</h1>
      <p>
        Assign the account to a device location. The “admin” role grants
        administrator privileges.
      </p>
      <form onSubmit={submit} className="form-grid" aria-busy={pending}>
        <div className="field">
          <label htmlFor="user-name">Username</label>
          <input
            className="input"
            id="user-name"
            name="name"
            autoComplete="username"
            required
            disabled={pending}
            value={form.name}
            onChange={change}
          />
        </div>
        <div className="field">
          <label htmlFor="user-email">Email address</label>
          <input
            className="input"
            id="user-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            value={form.email}
            onChange={change}
          />
        </div>
        <div className="field">
          <label htmlFor="user-role">Location / role</label>
          <input
            className="input"
            id="user-role"
            name="role"
            required
            disabled={pending}
            value={form.role}
            onChange={change}
            placeholder="e.g. house1"
          />
        </div>
        <div className="field">
          <label htmlFor="user-password">Password</label>
          <input
            className="input"
            id="user-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            required
            disabled={pending}
            value={form.password}
            onChange={change}
          />
        </div>
        <div className="field">
          <label htmlFor="confirm-password">Confirm password</label>
          <input
            className="input"
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
            value={form.confirmPassword}
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
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </section>
  );
}

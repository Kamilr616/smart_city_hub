import { useContext, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { UserContext } from './context/auth';
import { apiRequest, getApiErrorMessage } from './api';
import kiLogo from './assets/ki_LOGO_b.svg';

export default function Login() {
  const { user, setUser } = useContext(UserContext);
  const [form, setForm] = useState({ login: '', password: '' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  const navigate = useNavigate();
  useEffect(() => () => request.current?.abort(), []);

  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    if (!form.login.trim()) {
      setError('Enter your username or email address.');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError('');
    try {
      const session = await apiRequest('/user/auth', {
        method: 'POST',
        body: { login: form.login.trim(), password: form.password },
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setUser(session);
      navigate('/', { replace: true });
    } catch (failure) {
      if (failure.name !== 'AbortError')
        setError(
          failure.status === 401
            ? 'Incorrect username, email address, or password.'
            : getApiErrorMessage(failure),
        );
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  if (user) return <Navigate to="/" replace />;
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand">
          <img src={kiLogo} alt="KI" />
          Smart City Hub
        </div>
        <h1 id="login-title">Sign in</h1>
        <p>Enter your account details.</p>
        <form onSubmit={submit} className="form-grid" aria-busy={pending}>
          <div className="field">
            <label htmlFor="login">Username or email</label>
            <input
              className="input"
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              required
              disabled={pending}
              value={form.login}
              onChange={(event) =>
                setForm({ ...form, login: event.target.value })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button className="button" type="submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

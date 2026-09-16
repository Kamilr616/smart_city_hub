import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { UserContext } from '../context/auth';
import { apiRequest, getApiErrorMessage } from '../api';

function UserEditor({ account, onSaved, onCancel }) {
  const { user } = useContext(UserContext);
  const own = account._id === user.userId;
  const [form, setForm] = useState({
    name: account.name,
    email: account.email,
    role: account.role,
    isAdmin: account.isAdmin || account.role === 'admin',
    active: account.active !== false,
    password: '',
    confirmPassword: '',
  });
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'isAdmin' && !checked && previous.role === 'admin'
        ? { role: '' }
        : {}),
    }));
  };
  async function submit(e) {
    e.preventDefault();
    if (request.current) return;
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Hasła muszą być takie same.');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        isAdmin: form.isAdmin,
        active: form.active,
      };
      if (form.password) body.password = form.password;
      await apiRequest('/user/' + account._id, {
        method: 'PATCH',
        token: user.token,
        body,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) await onSaved();
    } catch (failure) {
      if (failure.name !== 'AbortError') setError(getApiErrorMessage(failure));
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }
  return (
    <section
      className="form-panel user-editor"
      aria-labelledby="edit-user-title"
    >
      <h2 id="edit-user-title">Edytuj użytkownika: {account.name}</h2>
      <p>
        {own
          ? 'Zapis zmian własnego konta zakończy Twoją sesję.'
          : 'Po zapisaniu zmian użytkownik będzie musiał zalogować się ponownie.'}
      </p>
      <form onSubmit={submit} aria-busy={pending}>
        <div className="field">
          <label htmlFor="edit-user-name">Nazwa użytkownika</label>
          <input
            id="edit-user-name"
            name="name"
            value={form.name}
            onChange={change}
            required
            maxLength={100}
            disabled={pending}
          />
        </div>
        <div className="field">
          <label htmlFor="edit-user-email">Adres e-mail</label>
          <input
            id="edit-user-email"
            name="email"
            type="email"
            value={form.email}
            onChange={change}
            required
            maxLength={254}
            disabled={pending}
          />
        </div>
        <div className="field">
          <label htmlFor="edit-user-role">Lokalizacja / rola</label>
          <input
            id="edit-user-role"
            name="role"
            value={form.role}
            onChange={change}
            required
            maxLength={100}
            disabled={pending || own}
          />
        </div>
        <label className="checkbox-field">
          <input
            type="checkbox"
            name="isAdmin"
            checked={form.isAdmin}
            onChange={change}
            disabled={pending || own}
          />{' '}
          Administrator
        </label>
        <label className="checkbox-field">
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={change}
            disabled={pending || own}
          />{' '}
          Konto aktywne
        </label>
        <div className="field">
          <label htmlFor="edit-user-password">Nowe hasło (opcjonalnie)</label>
          <input
            id="edit-user-password"
            type="password"
            name="password"
            value={form.password}
            onChange={change}
            minLength={12}
            maxLength={72}
            autoComplete="new-password"
            disabled={pending}
          />
          <small>
            Pozostaw puste, aby zachować hasło. Nowe hasło: co najmniej 12
            znaków.
          </small>
        </div>
        <div className="field">
          <label htmlFor="edit-user-confirm">Powtórz nowe hasło</label>
          <input
            id="edit-user-confirm"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={change}
            autoComplete="new-password"
            disabled={pending}
          />
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <div className="actions">
          <button className="button" disabled={pending}>
            {pending ? 'Zapisywanie…' : 'Zapisz zmiany'}
          </button>
          <button
            type="button"
            className="button button-secondary"
            disabled={pending}
            onClick={onCancel}
          >
            Anuluj
          </button>
        </div>
      </form>
    </section>
  );
}
UserEditor.propTypes = {
  account: PropTypes.object.isRequired,
  onSaved: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
export default function Users() {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [selected, setSelected] = useState(null),
    [search, setSearch] = useState('');
  const request = useRef(null);
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/user/list', {
        token: user.token,
        signal: controller.signal,
      });
      if (!Array.isArray(result)) throw new Error('Invalid list');
      if (!controller.signal.aborted) setUsers(result);
    } catch (failure) {
      if (!controller.signal.aborted) setError(getApiErrorMessage(failure));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [user.token]);
  useEffect(() => {
    load();
    return () => request.current?.abort();
  }, [load]);
  const filtered = users.filter((account) =>
    [account.name, account.email, account.role]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <h1>Użytkownicy</h1>
        <div className="actions">
          <button
            className="button button-secondary"
            onClick={load}
            disabled={loading || Boolean(selected)}
          >
            Odśwież użytkowników
          </button>
          <Link className="button" to="/users/new">
            Dodaj użytkownika
          </Link>
        </div>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      <section className="panel">
        <div className="toolbar">
          <label className="field search-field">
            <span>Szukaj użytkownika</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nazwa, e-mail lub rola"
            />
          </label>
        </div>
        {loading && <p role="status">Pobieranie użytkowników…</p>}
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>E-mail</th>
                <th>Lokalizacja / rola</th>
                <th>Dostęp</th>
                <th>Status</th>
                <th>Opcje</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => (
                <tr key={account._id}>
                  <td>{account.name}</td>
                  <td>{account.email}</td>
                  <td>{account.role}</td>
                  <td>
                    {account.isAdmin || account.role === 'admin'
                      ? 'Administrator'
                      : 'Użytkownik'}
                  </td>
                  <td>{account.active !== false ? 'Aktywny' : 'Nieaktywny'}</td>
                  <td>
                    <button
                      className="button button-secondary"
                      aria-label={'Edytuj: ' + account.name}
                      disabled={Boolean(selected)}
                      onClick={() => {
                        setSelected(account);
                        setMessage('');
                      }}
                    >
                      Edytuj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !filtered.length && (
          <p className="empty-state">
            {error
              ? 'Lista niedostępna.'
              : 'Brak użytkowników pasujących do wyszukiwania.'}
          </p>
        )}
      </section>
      {selected && (
        <UserEditor
          key={selected._id}
          account={selected}
          onCancel={() => setSelected(null)}
          onSaved={async () => {
            setSelected(null);
            setMessage('Zmiany zostały zapisane.');
            await load();
          }}
        />
      )}
    </>
  );
}

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
      setError('Passwords must match.');
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
      <h2 id="edit-user-title">Edit user: {account.name}</h2>
      <p>
        {own
          ? 'Saving changes to your own account will sign you out.'
          : 'The user will need to sign in again after you save changes.'}
      </p>
      <form onSubmit={submit} aria-busy={pending}>
        <div className="field">
          <label htmlFor="edit-user-name">Username</label>
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
          <label htmlFor="edit-user-email">Email address</label>
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
          <label htmlFor="edit-user-role">Location / role</label>
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
          Active account
        </label>
        <div className="field">
          <label htmlFor="edit-user-password">New password (optional)</label>
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
            Leave blank to keep the current password. New passwords need at least 12
            characters.
          </small>
        </div>
        <div className="field">
          <label htmlFor="edit-user-confirm">Confirm new password</label>
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
            {pending ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            className="button button-secondary"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
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
        <h1>Users</h1>
        <div className="actions">
          <button
            className="button button-secondary"
            onClick={load}
            disabled={loading || Boolean(selected)}
          >
            Refresh users
          </button>
          <Link className="button" to="/users/new">
            Add user
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
            <span>Search users</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email or role"
            />
          </label>
        </div>
        {loading && <p role="status">Loading users…</p>}
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Location / role</th>
                <th>Access</th>
                <th>Status</th>
                <th>Actions</th>
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
                      : 'User'}
                  </td>
                  <td>{account.active !== false ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button
                      className="button button-secondary"
                      aria-label={'Edit: ' + account.name}
                      disabled={Boolean(selected)}
                      onClick={() => {
                        setSelected(account);
                        setMessage('');
                      }}
                    >
                      Edit
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
              ? 'List unavailable.'
              : 'No users match your search.'}
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
            setMessage('Changes have been saved.');
            await load();
          }}
        />
      )}
    </>
  );
}

import { useContext, useRef, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { UserContext } from '../context/auth';
import { apiRequest, getApiErrorMessage } from '../api';
import DeviceHistory from './DeviceHistory';
import Icon from './Icon';
export default function Devices() {
  const { devices, states, errors, loading, refresh, isAdmin, updated } =
    useOutletContext();
  const { user, expireSession } = useContext(UserContext);
  const [params, setParams] = useSearchParams();
  const location = params.get('location') || '';
  const selected = params.get('device');
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(new Set());
  const pendingRef = useRef(new Set());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const locations = [
    ...new Set(devices.map((item) => item.location).filter(Boolean)),
  ].sort();
  const filtered = devices.filter(
    (d) =>
      (!location || d.location === location) &&
      (d.name + ' ' + d.description + ' ' + d.deviceId)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selectedDevice =
    selected === null
      ? null
      : devices.find((d) => String(d.deviceId) === selected);
  const changeParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    setParams(next);
  };
  async function mutate(device, remove = false) {
    if (pendingRef.current.has(device.deviceId)) return;
    if (
      remove &&
      !window.confirm(
        'Delete device “' +
          device.name +
          '”? Reading history will remain in the database.',
      )
    )
      return;
    pendingRef.current.add(device.deviceId);
    setPending((previous) => new Set(previous).add(device.deviceId));
    setError('');
    setMessage('');
    try {
      const state = states.find(
        (item) => item.deviceId === device.deviceId,
      )?.state;
      if (remove)
        await apiRequest('/device/' + device.deviceId, {
          method: 'DELETE',
          token: user.token,
        });
      else
        await apiRequest('/state/user/update', {
          method: 'POST',
          token: user.token,
          body: {
            deviceStates: [
              { deviceId: device.deviceId, state: state !== true },
            ],
          },
        });
      setMessage(
        remove ? 'Device deleted.' : 'Device state saved.',
      );
      await refresh();
    } catch (error) {
      if (error.status === 401) expireSession(user.token);
      else setError(getApiErrorMessage(error));
    } finally {
      pendingRef.current.delete(device.deviceId);
      setPending((previous) => {
        const next = new Set(previous);
        next.delete(device.deviceId);
        return next;
      });
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Devices</h1>
        </div>
        <div className="actions">
          <button
            className="button button-secondary"
            onClick={refresh}
            disabled={loading}
          >
            <Icon name="refresh" />
            Refresh
          </button>
          {isAdmin && (
            <Link className="button" to="/devices/new">
              <Icon name="add" />
              Add device
            </Link>
          )}
        </div>
      </div>
      <section className="panel">
        <div className="toolbar">
          <label className="search-field field">
            <span>Search devices</span>
            <input
              placeholder="Name, description or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Location</span>
            <select
              value={location}
              onChange={(e) => changeParam('location', e.target.value)}
            >
              <option value="">All locations</option>
              {locations.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </label>
          <span className="results-count">{filtered.length} devices</span>
        </div>
        {(errors.devices || errors.states || error) && (
          <p className="error-message" role="alert">
            {error || errors.devices || errors.states} Use Refresh to try loading
            the data again.
          </p>
        )}
        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}
        <div className="device-list">
          {filtered.map((device) => {
            const state = states.find(
              (item) => item.deviceId === device.deviceId,
            );
            const busy = pending.has(device.deviceId);
            return (
              <article
                key={device.deviceId}
                className={
                  'device-row' +
                  (String(device.deviceId) === selected ? ' selected' : '')
                }
              >
                <span
                  className={
                    'device-icon ' + (state?.state === true ? 'lit' : '')
                  }
                >
                  <Icon name="devices" />
                </span>
                <div className="device-details">
                  <div className="device-title">
                    <h2>{device.name || 'Device ' + device.deviceId}</h2>
                    <span className="device-id">#{device.deviceId}</span>
                  </div>
                  <p>{device.description || 'No device description.'}</p>
                  <span className="device-meta">
                    {device.location} · {device.type || 'device'}
                    {state?.timestamp
                      ? ' · ' +
                        new Date(state.timestamp).toLocaleString('en-GB')
                      : ''}
                  </span>
                </div>
                <span
                  className={
                    'badge ' +
                    (state?.state === true
                      ? 'badge-on'
                      : state?.state === false
                        ? 'badge-off'
                        : '')
                  }
                >
                  {state?.state === true
                    ? 'On'
                    : state?.state === false
                      ? 'Off'
                      : 'No state'}
                </span>
                <div className="device-actions">
                  {isAdmin && (
                    <Link
                      className="button button-secondary"
                      to={`/devices/${device.deviceId}/edit`}
                      aria-label={'Edit: ' + device.name}
                    >
                      Edit
                    </Link>
                  )}
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      changeParam('device', String(device.deviceId))
                    }
                    aria-label={'History: ' + device.name}
                  >
                    <Icon name="sensors" />
                    History
                  </button>
                  <button
                    className={
                      'button ' +
                      (state?.state === true ? 'button-secondary' : '')
                    }
                    onClick={() => mutate(device)}
                    disabled={
                      busy || Boolean(errors.states) || Boolean(errors.devices)
                    }
                    aria-label={
                      (state?.state === true ? 'Turn off: ' : 'Turn on: ') +
                      device.name
                    }
                  >
                    {busy
                      ? 'Saving…'
                      : state?.state === true
                        ? 'Turn off'
                        : 'Turn on'}
                  </button>
                  {isAdmin && (
                    <button
                      className="delete-button"
                      onClick={() => mutate(device, true)}
                      disabled={busy}
                      aria-label={'Delete: ' + device.name}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {!filtered.length && (
          <div className="empty-state">
            {loading
              ? 'Loading devices…'
              : errors.devices
                ? 'The device list is unavailable.'
                : 'No devices match the filters.'}
          </div>
        )}
      </section>
      {selectedDevice && (
        <section className="history-section">
          <button
            className="text-link history-close"
            onClick={() => changeParam('device', null)}
          >
            Close history ×
          </button>
          <DeviceHistory
            device={selectedDevice}
            refreshKey={updated?.getTime()}
          />
        </section>
      )}
    </>
  );
}

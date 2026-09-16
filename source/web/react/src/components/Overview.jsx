import { Link, useOutletContext } from 'react-router-dom';
import Icon from './Icon';
import { formatMetric } from '../charts/data';
export default function Overview() {
  const { devices, states, sensors, readings, errors, loading, refresh } =
    useOutletContext();
  const known = states.filter(
    (s) =>
      typeof s.state === 'boolean' &&
      devices.some((d) => d.deviceId === s.deviceId),
  );
  const on = known.filter((s) => s.state).length;
  const locations = [
    ...new Set([...devices, ...sensors].map((d) => d.location).filter(Boolean)),
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Overview</h1>
        </div>
        <button
          className="button button-secondary"
          onClick={refresh}
          disabled={loading}
        >
          <Icon name="refresh" />
          Refresh
        </button>
      </div>
      {!!Object.keys(errors).length && (
        <p role="alert" className="error-message">
          Some data could not be refreshed. Check your connection and try
          again.
        </p>
      )}
      <section className="summary-grid" aria-label="Summary">
        {[
          [
            'Devices',
            errors.devices ? '—' : devices.length,
            'Registered devices',
            'devices',
          ],
          [
            'On',
            errors.states ? '—' : on,
            known.length + ' with a known state',
            'overview',
          ],
          [
            'Sensors',
            errors.sensors ? '—' : sensors.length,
            'Measurement points',
            'sensors',
          ],
          ['Locations', locations.length, 'Available locations', 'locations'],
        ].map(([label, value, detail, icon]) => (
          <article className="summary-card" key={label}>
            <div className="summary-top">
              <span>{label}</span>
              <Icon name={icon} />
            </div>
            <strong>{loading && !devices.length ? '—' : value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Sensors</h2>
            </div>
            <Link className="text-link" to="/sensors">
              Charts <Icon name="arrow" />
            </Link>
          </div>
          <div className="sensor-preview-list">
            {sensors.map((sensor) => {
              const r = readings.find(
                (item) => item.deviceId === sensor.deviceId,
              );
              return (
                <Link
                  to={'/sensors?sensor=' + sensor.deviceId}
                  className="sensor-preview"
                  key={sensor.deviceId}
                >
                  <span className="sensor-symbol">
                    <Icon name="sensors" />
                  </span>
                  <div>
                    <strong>{sensor.name}</strong>
                    <span>
                      {sensor.location} ·{' '}
                      {r?.readingDate
                        ? new Date(r.readingDate).toLocaleString('en-GB')
                        : 'Waiting for the first reading'}
                    </span>
                  </div>
                  <b>
                    {typeof r?.temperature === 'number'
                      ? formatMetric(r.temperature) + ' °C'
                      : '—'}
                  </b>
                  <Icon name="arrow" />
                </Link>
              );
            })}
            {!sensors.length && (
              <p className="empty-state">
                {loading
                  ? 'Loading sensors…'
                  : 'No sensors are available.'}
              </p>
            )}
          </div>
        </section>
        <section className="panel locations-preview">
          <div className="panel-heading">
            <div>
              <h2>Locations</h2>
            </div>
            <Icon name="locations" />
          </div>
          {locations.map((city) => (
            <Link
              key={city}
              to={'/devices?location=' + encodeURIComponent(city)}
              className="location-preview"
            >
              <span>
                <strong>{city}</strong>
              </span>
              <b>
                {devices.filter((d) => d.location === city).length} devices
              </b>
              <Icon name="arrow" />
            </Link>
          ))}
          {!locations.length && (
            <p className="empty-state">No locations are available.</p>
          )}
          <Link to="/locations" className="text-link all-locations">
            All locations <Icon name="arrow" />
          </Link>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Devices</h2>
          </div>
          <Link className="text-link" to="/devices">
            All devices <Icon name="arrow" />
          </Link>
        </div>
        <div className="quick-devices">
          {devices.slice(0, 4).map((device) => {
            const state = states.find(
              (s) => s.deviceId === device.deviceId,
            )?.state;
            return (
              <Link
                to={'/devices?device=' + device.deviceId}
                key={device.deviceId}
                className="quick-device"
              >
                <Icon name="devices" />
                <strong>{device.name}</strong>
                <span
                  className={
                    'badge ' +
                    (state === true
                      ? 'badge-on'
                      : state === false
                        ? 'badge-off'
                        : '')
                  }
                >
                  {state === true
                    ? 'On'
                    : state === false
                      ? 'Off'
                      : 'No state'}
                </span>
              </Link>
            );
          })}
          {!devices.length && (
            <p className="empty-state">
              {loading
                ? 'Loading devices…'
                : 'No registered devices.'}
            </p>
          )}
        </div>
      </section>
    </>
  );
}

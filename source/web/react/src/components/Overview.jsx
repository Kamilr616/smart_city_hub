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
          <p className="eyebrow">TWOJA MAKIETA, W JEDNYM MIEJSCU</p>
          <h1>
            Miasto pod kontrolą<span className="accent">.</span>
          </h1>
          <p>
            Urządzenia, środowisko i historia działania Twojego miasta LEGO.
          </p>
        </div>
        <button
          className="button button-secondary"
          onClick={refresh}
          disabled={loading}
        >
          <Icon name="refresh" />
          Odśwież
        </button>
      </div>
      {!!Object.keys(errors).length && (
        <p role="alert" className="error-message">
          Nie udało się odświeżyć części danych. Sprawdź połączenie i spróbuj
          ponownie.
        </p>
      )}
      <section className="summary-grid" aria-label="Podsumowanie makiety">
        {[
          [
            'Urządzenia',
            errors.devices ? '—' : devices.length,
            'Zarejestrowane w API',
            'devices',
          ],
          [
            'Włączone',
            errors.states ? '—' : on,
            known.length + ' ze znanym stanem',
            'overview',
          ],
          [
            'Czujniki',
            errors.sensors ? '—' : sensors.length,
            'Punkty pomiarowe',
            'sensors',
          ],
          ['Locations', locations.length, 'Dostępne lokalizacje', 'locations'],
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
              <p className="eyebrow">PUNKTY POMIAROWE</p>
              <h2>Środowisko miasta</h2>
            </div>
            <Link className="text-link" to="/sensors">
              Wykresy <Icon name="arrow" />
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
                        ? new Date(r.readingDate).toLocaleString('pl-PL')
                        : 'Oczekiwanie na pierwszy pomiar'}
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
                  ? 'Pobieranie czujników…'
                  : 'Nie ma dostępnych czujników.'}
              </p>
            )}
          </div>
          <div className="info-note">
            <span className="info-dot">i</span>Pomiary pochodzą z API. Jeśli ESP
            nie jest podłączone, czujniki czekają na dane.
          </div>
        </section>
        <section className="panel locations-preview">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">TWOJE OBSZARY</p>
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
                <small>Rola / lokalizacja</small>
              </span>
              <b>
                {devices.filter((d) => d.location === city).length} urządzeń
              </b>
              <Icon name="arrow" />
            </Link>
          ))}
          {!locations.length && (
            <p className="empty-state">Brak dostępnych lokalizacji.</p>
          )}
          <Link to="/locations" className="text-link all-locations">
            Wszystkie lokalizacje <Icon name="arrow" />
          </Link>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">SZYBKI PODGLĄD</p>
            <h2>Urządzenia makiety</h2>
          </div>
          <Link className="text-link" to="/devices">
            Wszystkie urządzenia <Icon name="arrow" />
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
                    ? 'Włączone'
                    : state === false
                      ? 'Wyłączone'
                      : 'Brak stanu'}
                </span>
              </Link>
            );
          })}
          {!devices.length && (
            <p className="empty-state">
              {loading
                ? 'Pobieranie urządzeń…'
                : 'Brak zarejestrowanych urządzeń.'}
            </p>
          )}
        </div>
      </section>
    </>
  );
}

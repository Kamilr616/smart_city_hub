import { Link, useOutletContext } from 'react-router-dom';
import Icon from './Icon';
export default function Locations() {
  const { devices, sensors, states, errors, loading } = useOutletContext();
  const locations = [
    ...new Set(
      [...devices, ...sensors].map((item) => item.location).filter(Boolean),
    ),
  ].sort();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Locations</h1>
          <p>Obszary makiety dostępne dla Twojego konta.</p>
        </div>
        <span className="count-pill">{locations.length} lokalizacji</span>
      </div>
      {Object.keys(errors).length > 0 && (
        <p className="error-message" role="alert">
          Lista lokalizacji może być niepełna. Nie udało się odświeżyć
          wszystkich danych.
        </p>
      )}
      <div className="locations-grid">
        {locations.map((location) => {
          const list = devices.filter((d) => d.location === location);
          const enabled = list.filter((d) =>
            states.some((s) => s.deviceId === d.deviceId && s.state === true),
          ).length;
          return (
            <article className="panel location-card" key={location}>
              <div className="location-card-top">
                <span className="location-symbol">
                  <Icon name="locations" />
                </span>
                <span className="badge">Dostępna</span>
              </div>
              <h2>{location}</h2>
              <p>
                Rola dostępu: <strong>{location}</strong>
              </p>
              <div className="location-stats">
                <div>
                  <strong>{list.length}</strong>
                  <span>urządzeń</span>
                </div>
                <div>
                  <strong>
                    {sensors.filter((s) => s.location === location).length}
                  </strong>
                  <span>czujników</span>
                </div>
                <div>
                  <strong>{enabled}</strong>
                  <span>włączonych</span>
                </div>
              </div>
              <Link
                className="button button-secondary full-width"
                to={'/devices?location=' + encodeURIComponent(location)}
              >
                Zobacz urządzenia <Icon name="arrow" />
              </Link>
            </article>
          );
        })}
      </div>
      {!locations.length && (
        <div className="panel empty-state">
          {loading
            ? 'Pobieranie lokalizacji…'
            : 'Brak lokalizacji przypisanych do dostępnych urządzeń i czujników.'}
        </div>
      )}
    </>
  );
}

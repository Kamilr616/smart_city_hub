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
          <p>Model areas available to your account.</p>
        </div>
        <span className="count-pill">{locations.length} locations</span>
      </div>
      {Object.keys(errors).length > 0 && (
        <p className="error-message" role="alert">
          The location list may be incomplete. Some data could not be
          refreshed.
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
                <span className="badge">Available</span>
              </div>
              <h2>{location}</h2>
              <p>
                Access role: <strong>{location}</strong>
              </p>
              <div className="location-stats">
                <div>
                  <strong>{list.length}</strong>
                  <span>devices</span>
                </div>
                <div>
                  <strong>
                    {sensors.filter((s) => s.location === location).length}
                  </strong>
                  <span>sensors</span>
                </div>
                <div>
                  <strong>{enabled}</strong>
                  <span>on</span>
                </div>
              </div>
              <Link
                className="button button-secondary full-width"
                to={'/devices?location=' + encodeURIComponent(location)}
              >
                View devices <Icon name="arrow" />
              </Link>
            </article>
          );
        })}
      </div>
      {!locations.length && (
        <div className="panel empty-state">
          {loading
            ? 'Loading locations…'
            : 'No locations are assigned to the available devices and sensors.'}
        </div>
      )}
    </>
  );
}

import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import HistoryChart from './HistoryChart';
import { useHistory } from '../charts/useHistory';
import {
  buildStateSeries,
  formatTimestamp,
  RANGE_OPTIONS,
} from '../charts/data';

export default function DeviceHistory({ device, refreshKey = 0 }) {
  const [range, setRange] = useState('24h');
  const [refresh, setRefresh] = useState(0);
  const selectId = useId();
  const { data, loading, error } = useHistory(
    `/state/history/${encodeURIComponent(device.deviceId)}`,
    range,
    `${refresh}:${refreshKey}`,
  );
  const points = data ? buildStateSeries(data) : [];
  const observations =
    data?.states?.filter(
      (item) =>
        typeof item.state === 'boolean' &&
        Number.isFinite(Date.parse(item.timestamp)),
    ) ?? [];
  return (
    <section className="panel" aria-label={`State history: ${device.name}`}>
      <div className="panel-heading">
        <div>
          <h2>State history · {device.name}</h2>
        </div>
        <div className="toolbar">
          <div className="field">
            <label htmlFor={selectId}>State history time range</label>
            <select
              className="select"
              id={selectId}
              value={range}
              onChange={(event) => setRange(event.target.value)}
            >
              {RANGE_OPTIONS.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </div>
          <button
            className="button button-secondary"
            disabled={loading}
            onClick={() => setRefresh((value) => value + 1)}
          >
            Refresh history
          </button>
        </div>
      </div>
      {loading && <p role="status">Loading state history…</p>}
      {error && (
        <p className="error-message" role="alert">
          Could not load history. {error}
        </p>
      )}
      {data && !loading && (
        <>
          {data.truncated && (
            <p className="badge" role="status">
              History limit: showing the latest entries. The omitted period
              remains empty.
            </p>
          )}
          {!points.length ? (
            <div className="empty-state">
              No recorded states in this period. The device state is
              unknown.
            </div>
          ) : (
            <>
              <HistoryChart
                series={[
                  { label: 'Device state', color: '#059669', data: points },
                ]}
                from={data.from}
                to={data.to}
                binary
                label={`State chart for device ${device.name}. Data is also available in the table below.`}
              />
              <p>
                The chart shows the last recorded state until the next entry or
                the end of the time range. It does not confirm device connectivity.
              </p>
              {data.initialState === null && (
                <p>The state before the first entry is unknown.</p>
              )}
              <details>
                <summary>Show history as a table</summary>
                <div className="table-scroll">
                  <table>
                    <caption>Recorded states · {device.name}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Time</th>
                        <th scope="col">State</th>
                        <th scope="col">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!data.truncated &&
                        typeof data.initialState === 'boolean' && (
                          <tr>
                            <td>{formatTimestamp(data.from)}</td>
                            <td>
                              {data.initialState ? 'On' : 'Off'}
                            </td>
                            <td>Last record before the start of the time range</td>
                          </tr>
                        )}
                      {observations.map((item, index) => (
                        <tr key={`${item.timestamp}-${index}`}>
                          <td>{formatTimestamp(item.timestamp)}</td>
                          <td>{item.state ? 'On' : 'Off'}</td>
                          <td>State record</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </>
      )}
    </section>
  );
}
DeviceHistory.propTypes = {
  refreshKey: PropTypes.number,
  device: PropTypes.shape({
    deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};

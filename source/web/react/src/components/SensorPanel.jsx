import { useContext, useEffect, useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest, getApiErrorMessage } from '../api';
import { UserContext } from '../context/auth';
import { useHistory } from '../charts/useHistory';
import {
  buildSensorSeries,
  createDemoHistory,
  formatMetric,
  formatTimestamp,
  isStaleReading,
  METRICS,
  RANGE_OPTIONS,
} from '../charts/data';
import HistoryChart from './HistoryChart';

export default function SensorPanel() {
  const { user, expireSession } = useContext(UserContext);
  const [catalog, setCatalog] = useState([]);
  const [latest, setLatest] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [latestError, setLatestError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [range, setRange] = useState('24h');
  const [refresh, setRefresh] = useState(0);
  const [demo, setDemo] = useState(false);
  const [chartMetric, setChartMetric] = useState(() =>
    window.matchMedia('(max-width: 600px)').matches ? 'temperature' : 'all',
  );
  const sensorSelect = useId();
  const rangeSelect = useId();
  const metricSelect = useId();
  const token = user?.token;

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    setCatalogError('');
    setLatestError('');
    setLatest([]);
    Promise.allSettled([
      apiRequest('/sensor/catalog', { token, signal: controller.signal }),
      apiRequest('/sensor/all/latest', { token, signal: controller.signal }),
    ]).then(([catalogResult, latestResult]) => {
      if (controller.signal.aborted) return;
      if (
        [catalogResult, latestResult].some(
          (result) =>
            result.status === 'rejected' && result.reason.status === 401,
        )
      ) {
        expireSession(token);
        return;
      }
      if (catalogResult.status === 'fulfilled')
        setCatalog(
          Array.isArray(catalogResult.value) ? catalogResult.value : [],
        );
      else {
        setCatalog([]);
        setCatalogError(getApiErrorMessage(catalogResult.reason));
      }
      if (latestResult.status === 'fulfilled')
        setLatest(Array.isArray(latestResult.value) ? latestResult.value : []);
      else setLatestError(getApiErrorMessage(latestResult.reason));
      setLoading(false);
    });
    return () => controller.abort();
  }, [token, refresh, expireSession]);

  const visibleCatalog = catalog.filter(
    (sensor) =>
      user?.isAdmin || user?.role === 'admin' || sensor.location === user?.role,
  );
  const sensor =
    visibleCatalog.find(
      (item) => String(item.deviceId) === searchParams.get('sensor'),
    ) ?? visibleCatalog[0];
  const selected = sensor ? String(sensor.deviceId) : '';
  const liveHistory = useHistory(
    sensor && !demo
      ? `/sensor/history/${encodeURIComponent(sensor.deviceId)}`
      : null,
    range,
    refresh,
  );
  const demoHistory = useMemo(
    () => (demo && selected !== '' ? createDemoHistory(range, selected) : null),
    [demo, range, selected],
  );
  const history = demo
    ? { data: demoHistory, loading: false, error: '' }
    : liveHistory;
  const reading = demo
    ? demoHistory?.readings.at(-1)
    : latest.find((item) => String(item.deviceId) === selected);
  const values = buildSensorSeries(history.data?.readings);
  const hasMeasurements = Object.values(values).some((points) =>
    points.some((point) => point.y !== null),
  );
  const metrics = METRICS.map((metric) => ({
    ...metric,
    unit:
      sensor?.measurements?.find((item) => item.kind === metric.key)?.unit ||
      metric.unit,
  }));
  const readings = (history.data?.readings ?? [])
    .filter((item) => Number.isFinite(Date.parse(item.readingDate)))
    .slice()
    .sort((a, b) => Date.parse(a.readingDate) - Date.parse(b.readingDate));

  useEffect(() => {
    if (demo || loading || liveHistory.loading) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible')
        setRefresh((value) => value + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, [demo, loading, liveHistory.loading]);

  function selectSensor(event) {
    const next = new URLSearchParams(searchParams);
    next.set('sensor', event.target.value);
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="sensor-panel">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Measurement points</h2>
            <p>
              Temperature, humidity and pressure from registered sensors.
            </p>
          </div>
          <button
            className="button button-secondary"
            disabled={loading || history.loading || demo}
            onClick={() => setRefresh((value) => value + 1)}
          >
            Refresh readings
          </button>
        </div>
        {loading && <p role="status">Loading sensors…</p>}
        {catalogError && (
          <p className="error-message" role="alert">
            Could not load the sensor catalogue. {catalogError}
          </p>
        )}
        {!loading && !catalogError && !visibleCatalog.length && (
          <div className="empty-state">
            No registered sensors in your locations.
          </div>
        )}
        {sensor && (
          <>
            <div className="toolbar">
              <div className="field">
                <label htmlFor={sensorSelect}>Sensor</label>
                <select
                  id={sensorSelect}
                  className="select"
                  value={selected}
                  onChange={selectSensor}
                >
                  {visibleCatalog.map((item) => (
                    <option key={item.deviceId} value={item.deviceId}>
                      {item.name} · {item.location}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={rangeSelect}>Time range</label>
                <select
                  id={rangeSelect}
                  className="select"
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
              <label>
                <input
                  type="checkbox"
                  checked={demo}
                  onChange={(event) => setDemo(event.target.checked)}
                />{' '}
                Demo mode (DEMO)
              </label>
            </div>
            <div className="panel-heading">
              <div>
                <h3>{sensor.name}</h3>
                <p>
                  {sensor.description || 'Registered environmental sensor.'}
                </p>
              </div>
              <span className="badge">
                {sensor.location} · ID {sensor.deviceId}
              </span>
            </div>
            {demo && (
              <p className="badge" role="status">
                <strong>DEMO — sample data.</strong> Values generated in your
                browser and not saved on the server.
              </p>
            )}
            {!demo && latestError && (
              <p role="alert" className="error-message">
                The latest reading is unavailable. {latestError}
              </p>
            )}
            <div className="metrics-grid">
              {metrics.map((metric) => (
                <article className="metric-card" key={metric.key}>
                  <span>
                    {demo ? 'DEMO · ' : ''}
                    {metric.label}
                  </span>
                  <strong>{`${formatMetric(reading?.[metric.key])} ${metric.unit}`}</strong>
                </article>
              ))}
            </div>
            <p>
              {demo ? 'Sample reading time' : 'Last reading'}:{' '}
              {formatTimestamp(reading?.readingDate)}
            </p>
            {!demo && isStaleReading(reading) && (
              <p className="badge" role="status">
                Outdated reading — data is more than 15 minutes old.
              </p>
            )}
            {!demo && (
              <p>
                Refreshes automatically every 30 seconds while the tab is visible.
              </p>
            )}
          </>
        )}
      </section>
      {sensor && (
        <section
          className="panel"
          aria-label={`${demo ? 'DEMO · ' : ''}Reading history: ${sensor.name}`}
        >
          <div className="panel-heading">
            <div>
              <h2>
                {demo ? 'DEMO · Sample chart' : 'Reading history'}
              </h2>
            </div>
            <span className="badge">{sensor.name}</span>
          </div>
          <div className="field chart-metric-selector">
            <label htmlFor={metricSelect}>Chart parameter</label>
            <select
              id={metricSelect}
              className="select"
              value={chartMetric}
              onChange={(event) => setChartMetric(event.target.value)}
            >
              <option value="all">All</option>
              {metrics.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>
          {history.loading && (
            <p role="status">Loading reading history…</p>
          )}
          {history.error && (
            <p className="error-message" role="alert">
              Could not load reading history. {history.error}
            </p>
          )}
          {history.data && !history.loading && (
            <>
              {history.data.truncated && (
                <p className="badge" role="status">
                  History limit: showing the latest 1000 readings. Select
                  a shorter time range to see more detail.
                </p>
              )}
              {!hasMeasurements ? (
                <div className="empty-state">
                  No readings in the selected period. The sensor is registered,
                  but there is no data to display.
                </div>
              ) : (
                <>
                  <HistoryChart
                    series={metrics
                      .filter(
                        (metric) =>
                          chartMetric === 'all' || metric.key === chartMetric,
                      )
                      .map((metric) => ({
                        ...metric,
                        data: values[metric.key],
                      }))}
                    from={history.data.from}
                    to={history.data.to}
                    label={`${demo ? 'DEMO · ' : ''}Reading chart for sensor ${sensor.name}. Data is also available in the table below.`}
                  />
                  <details>
                    <summary>Show readings as a table</summary>
                    <div className="table-scroll">
                      <table>
                        <caption>
                          {demo ? 'DEMO · Sample data' : 'Readings'} ·{' '}
                          {sensor.name}
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Reading time</th>
                            {metrics.map((metric) => (
                              <th key={metric.key} scope="col">
                                {metric.label} ({metric.unit})
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {readings.map((item, index) => (
                            <tr key={`${item.readingDate}-${index}`}>
                              <td>{formatTimestamp(item.readingDate)}</td>
                              {metrics.map((metric) => (
                                <td key={metric.key}>
                                  {formatMetric(item[metric.key])}
                                </td>
                              ))}
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
      )}
    </div>
  );
}

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
            <p className="eyebrow">ŚRODOWISKO MIASTA</p>
            <h2>Punkty pomiarowe</h2>
            <p>
              Temperatura, wilgotność i ciśnienie z zarejestrowanych czujników.
            </p>
          </div>
          <button
            className="button button-secondary"
            disabled={loading || history.loading || demo}
            onClick={() => setRefresh((value) => value + 1)}
          >
            Odśwież pomiary
          </button>
        </div>
        {loading && <p role="status">Wczytywanie czujników…</p>}
        {catalogError && (
          <p className="error-message" role="alert">
            Nie udało się pobrać katalogu czujników. {catalogError}
          </p>
        )}
        {!loading && !catalogError && !visibleCatalog.length && (
          <div className="empty-state">
            Brak zarejestrowanych czujników w Twoich lokalizacjach.
          </div>
        )}
        {sensor && (
          <>
            <div className="toolbar">
              <div className="field">
                <label htmlFor={sensorSelect}>Czujnik</label>
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
                <label htmlFor={rangeSelect}>Zakres czasu</label>
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
                Tryb demonstracyjny (DEMO)
              </label>
            </div>
            <div className="panel-heading">
              <div>
                <h3>{sensor.name}</h3>
                <p>
                  {sensor.description || 'Zarejestrowany czujnik środowiskowy.'}
                </p>
              </div>
              <span className="badge">
                {sensor.location} · ID {sensor.deviceId}
              </span>
            </div>
            {demo && (
              <p className="badge" role="status">
                <strong>DEMO — przykładowe dane.</strong> Wartości wygenerowane
                w przeglądarce, niezapisane na serwerze.
              </p>
            )}
            {!demo && latestError && (
              <p role="alert" className="error-message">
                Najnowszy pomiar jest niedostępny. {latestError}
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
              {demo ? 'Czas przykładowej wartości' : 'Ostatni pomiar'}:{' '}
              {formatTimestamp(reading?.readingDate)}
            </p>
            {!demo && isStaleReading(reading) && (
              <p className="badge" role="status">
                Nieaktualny pomiar — dane są starsze niż 15 minut.
              </p>
            )}
            {!demo && (
              <p>
                Automatyczne odświeżanie co 30 sekund, gdy karta jest widoczna.
              </p>
            )}
          </>
        )}
      </section>
      {sensor && (
        <section
          className="panel"
          aria-label={`${demo ? 'DEMO · ' : ''}Historia pomiarów: ${sensor.name}`}
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {demo ? 'DEMO — DANE PRZYKŁADOWE' : 'DANE W CZASIE'}
              </p>
              <h2>
                {demo ? 'DEMO · Przykładowy wykres' : 'Historia pomiarów'}
              </h2>
            </div>
            <span className="badge">{sensor.name}</span>
          </div>
          <div className="field chart-metric-selector">
            <label htmlFor={metricSelect}>Parametr wykresu</label>
            <select
              id={metricSelect}
              className="select"
              value={chartMetric}
              onChange={(event) => setChartMetric(event.target.value)}
            >
              <option value="all">Wszystkie</option>
              {metrics.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>
          {history.loading && (
            <p role="status">Wczytywanie historii pomiarów…</p>
          )}
          {history.error && (
            <p className="error-message" role="alert">
              Nie udało się pobrać historii pomiarów. {history.error}
            </p>
          )}
          {history.data && !history.loading && (
            <>
              {history.data.truncated && (
                <p className="badge" role="status">
                  Limit historii: pokazano najnowsze 1000 pomiarów. Wybierz
                  krótszy zakres, aby zobaczyć więcej szczegółów.
                </p>
              )}
              {!hasMeasurements ? (
                <div className="empty-state">
                  Brak pomiarów w wybranym okresie. Czujnik jest zarejestrowany,
                  ale nie ma danych do wyświetlenia.
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
                    label={`${demo ? 'DEMO · ' : ''}Wykres pomiarów czujnika ${sensor.name}. Dane dostępne także w tabeli poniżej.`}
                  />
                  <details>
                    <summary>Pokaż pomiary w tabeli</summary>
                    <div className="table-scroll">
                      <table>
                        <caption>
                          {demo ? 'DEMO · Dane przykładowe' : 'Pomiary'} ·{' '}
                          {sensor.name}
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Czas pomiaru</th>
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

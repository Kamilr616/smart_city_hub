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
    <section className="panel" aria-label={`Historia stanów: ${device.name}`}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ZAPISANE STANY URZĄDZENIA</p>
          <h2>Historia stanów · {device.name}</h2>
        </div>
        <div className="toolbar">
          <div className="field">
            <label htmlFor={selectId}>Zakres historii stanów</label>
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
            Odśwież historię
          </button>
        </div>
      </div>
      {loading && <p role="status">Wczytywanie historii stanów…</p>}
      {error && (
        <p className="error-message" role="alert">
          Nie udało się pobrać historii. {error}
        </p>
      )}
      {data && !loading && (
        <>
          {data.truncated && (
            <p className="badge" role="status">
              Limit historii: pokazano najnowsze wpisy. Pominięty okres
              pozostaje pusty.
            </p>
          )}
          {!points.length ? (
            <div className="empty-state">
              Brak zapisanych stanów w tym okresie. Stan urządzenia jest
              nieznany.
            </div>
          ) : (
            <>
              <HistoryChart
                series={[
                  { label: 'Stan urządzenia', color: '#059669', data: points },
                ]}
                from={data.from}
                to={data.to}
                binary
                label={`Wykres stanów urządzenia ${device.name}. Dane dostępne także w tabeli poniżej.`}
              />
              <p>
                Wykres pokazuje ostatni zapisany stan aż do kolejnego wpisu lub
                końca zakresu. Nie potwierdza łączności urządzenia.
              </p>
              {data.initialState === null && (
                <p>Stan przed pierwszym wpisem jest nieznany.</p>
              )}
              <details>
                <summary>Pokaż historię w tabeli</summary>
                <div className="table-scroll">
                  <table>
                    <caption>Zapisane stany · {device.name}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Czas</th>
                        <th scope="col">Stan</th>
                        <th scope="col">Źródło</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!data.truncated &&
                        typeof data.initialState === 'boolean' && (
                          <tr>
                            <td>{formatTimestamp(data.from)}</td>
                            <td>
                              {data.initialState ? 'Włączone' : 'Wyłączone'}
                            </td>
                            <td>Ostatni zapis przed początkiem zakresu</td>
                          </tr>
                        )}
                      {observations.map((item, index) => (
                        <tr key={`${item.timestamp}-${index}`}>
                          <td>{formatTimestamp(item.timestamp)}</td>
                          <td>{item.state ? 'Włączone' : 'Wyłączone'}</td>
                          <td>Zapis stanu</td>
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

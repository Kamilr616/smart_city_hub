import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatTimestamp } from '../charts/data';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function HistoryChart({
  series,
  from,
  to,
  label,
  binary = false,
}) {
  const scales = {
    x: {
      type: 'linear',
      min: Date.parse(from),
      max: Date.parse(to),
      title: { display: true, text: 'Czas lokalny' },
      ticks: {
        maxTicksLimit: 4,
        callback: (value) => [
          new Date(value).toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
          }),
          new Date(value).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        ],
      },
      grid: { color: '#eef2f6' },
    },
  };
  for (const [index, item] of series.entries()) {
    scales[`y${index}`] = {
      type: 'linear',
      position: index === 0 ? 'left' : 'right',
      title: {
        display: true,
        text: binary ? 'Stan' : `${item.label} (${item.unit})`,
        color: item.color,
      },
      grid: { drawOnChartArea: index === 0, color: '#eef2f6' },
      ticks: binary
        ? {
            stepSize: 1,
            callback: (value) =>
              value === 1 ? 'Włączone' : value === 0 ? 'Wyłączone' : '',
          }
        : { maxTicksLimit: 6 },
      ...(binary ? { min: 0, max: 1 } : {}),
    };
  }
  const data = {
    datasets: series.map((item, index) => ({
      label: binary ? item.label : `${item.label} (${item.unit})`,
      data: item.data,
      borderColor: item.color,
      backgroundColor: item.color,
      borderWidth: 2,
      yAxisID: `y${index}`,
      pointRadius: item.data.length === 1 ? 4 : 1.5,
      pointHoverRadius: 5,
      stepped: binary ? 'before' : false,
      tension: 0,
      spanGaps: false,
    })),
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    parsing: false,
    scales,
    interaction: { intersect: false, mode: 'nearest', axis: 'x' },
    plugins: {
      legend: {
        display: !binary,
        position: 'bottom',
        labels: { boxWidth: 12, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          title: (items) =>
            items.length ? formatTimestamp(items[0].parsed.x) : '',
          label: (context) =>
            binary
              ? `Stan: ${context.parsed.y === 1 ? 'włączone' : 'wyłączone'}`
              : `${context.dataset.label}: ${context.parsed.y.toLocaleString('pl-PL')}`,
        },
      },
    },
  };
  return (
    <div
      className={`history-chart-viewport${series.length > 1 ? ' history-chart-viewport--combined' : ''}`}
      tabIndex={series.length > 1 ? 0 : undefined}
      role={series.length > 1 ? 'region' : undefined}
      aria-label={
        series.length > 1
          ? 'Wykres wielu parametrów — przewiń poziomo, aby zobaczyć całość'
          : undefined
      }
    >
      <div className="chart-wrap">
        <Line data={data} options={options} role="img" aria-label={label} />
      </div>
    </div>
  );
}

HistoryChart.propTypes = {
  series: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      unit: PropTypes.string,
      color: PropTypes.string.isRequired,
      data: PropTypes.arrayOf(
        PropTypes.shape({
          x: PropTypes.number.isRequired,
          y: PropTypes.number,
        }),
      ).isRequired,
    }),
  ).isRequired,
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  binary: PropTypes.bool,
};

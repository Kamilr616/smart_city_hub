import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import SingleRecord from './singleRecord';


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top' as const,
        },
        title: {
            display: true,
            text: 'Chart.js Line Chart',
        },
    },
};

export type Data = {
    pressure: string;
    temperature: string;
    humidity: string;
    readingDate: string;
};

function generateChartData(data: Data[]) {
    const labels = data.map(entry => new Date(entry.readingDate).toLocaleTimeString());
    const pressureData = data.map(entry => parseFloat(entry.pressure));
    const temperatureData = data.map(entry => parseFloat(entry.temperature));
    const humidityData = data.map(entry => parseFloat(entry.humidity));

    return {
        labels,
        datasets: [
            {
                label: 'Pressure',
                data: pressureData,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Temperature',
                data: temperatureData,
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
                label: 'Humidity',
                data: humidityData,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
        ],
    };
}

function Charts() {
    const [chartData, setChartData] = useState();
    const [firstRecord, setFirstRecord] = useState<Data>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:4200/api/sensor/all');
                const result = await response.json();

                console.log(result)

                const formattedChartData = generateChartData(result[2]);
                //TODO: map by deviceId

                // @ts-ignore
                setChartData(formattedChartData);
                setLoading(false);

                console.log(chartData)
            } catch (error) {
                console.error('Błąd podczas pobierania danych:', error);
                setLoading(false);
            }
        };

        const fetchFirstRecord = async () => {
            try {
                const response = await fetch('http://localhost:4200/api/sensor/all/latest');
                const result = await response.json();

                setFirstRecord(result[0]);
            } catch (error) {
                console.error('Błąd podczas pobierania danych:', error);
            }
        }

        fetchData();
        fetchFirstRecord();
    }, []);

    return (
        <div style={{ padding: 20 }}>
            <h2>Komponent Charts</h2>
            {loading && !chartData && firstRecord === undefined ? <div>Loading</div> : <div><SingleRecord record={firstRecord} /> <Line options={options} data={chartData} /></div>}
        </div>
    );
}

export default Charts;

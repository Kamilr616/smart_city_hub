import {useEffect, useState} from 'react';
import axios from 'axios';

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
    },
};


function generateChartData(data: any[] | undefined) {
    if (!data) return null;

    const flattenedData = data.flatMap(entry => entry);

    const labels = flattenedData.map(entry => {
        const timestamp = new Date(entry[1]);
        return `${timestamp.getHours()}:${timestamp.getMinutes()}:${timestamp.getSeconds()}`;
    });

    const airHumData = flattenedData.map(entry => parseFloat(entry[0]));

    return {
        labels,
        datasets: [
            {
                label: 'Air Humidity',
                data: airHumData,
                borderColor: 'rgb(75, 100, 255)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
        ],
    };
}

// @ts-ignore
function HumChart({ EUID }) {
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const url = `https://sensecap.seeed.cc/openapi/list_telemetry_data?device_eui=${EUID}&measurement_id=4098`;
                const username = 'LHY5MB7C3C8WTAA5';
                const password = '34C99BBDA28A4BCD9C96EE749DAB454A32D60656623C47B583029382F350F555';

                const response = await axios.get(url, {
                    auth: {
                        username,
                        password
                    }
                });

                const jsonData = response.data;
                const formattedChartData = generateChartData(jsonData?.data?.list[1]);

                setChartData(formattedChartData);
                setLoading(false);
            } catch (error) {
                console.error('Error:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [EUID]);

    return (
        <div style={{padding: 20}}>
            {chartData && !loading ? <Line options={options} data={chartData}/> : <span>Loading...</span>}
        </div>
    );
}

export default HumChart;

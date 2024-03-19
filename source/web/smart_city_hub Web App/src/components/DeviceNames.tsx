import React, { useState, useEffect } from 'react';
import {Button, Box, Card, CardContent, Typography} from "@mui/material";

const DeviceNames = ({ channelNumber, apiKey }: { channelNumber: number, apiKey: string }) => {
    const [dname, setDName] = useState<any[] | null>(null);
    const [fields, setFields] = useState<any[] | null>(null);
    const [states, setStates] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);

const handleButtonClick = (index: number) => {
    setLoading(true);
    const newStates = [...states];
    newStates[index] = newStates[index] === 1 ? 0 : 1;

        // Make GET request inside the setStates callback
        (async () => {
            try {
                let url = 'https://api.thingspeak.com/update.json?api_key=';
                url += apiKey;
                newStates.forEach((state, i) => {
                    url += `&field${i+1}=${state}`;
                });

                const response = await fetch(url);
                const result = await response.json();
                console.log(newStates);
                console.log(result);
                    if(result != 0) {
                    const respondStates = [];
                    for (let i = 1; i <= 8; i++) {
                        respondStates.push(parseInt(result[`field${i}`]));
                    }
                console.log(respondStates);
                setStates(respondStates);
                setLoading(false);
                     }
                    else {
                    await fetchData();
                    }
            } catch (error) {
                console.error('Error during GET request:', error);
                }
        })();

};
       const fetchData = async () => {
           try {
               const response = await fetch(`https://api.thingspeak.com/channels/${channelNumber}/feeds.json?api_key=${apiKey}&results=1`);
               const result = await response.json();

               const fields = [];
               for (let i = 1; i <= 8; i++) {
                   fields.push(result.channel[`field${i}`]);
               }

               const states = [];
               const stateslength = result.feeds.length;

               for (let i = 1; i <= 8; i++) {
                   states.push(parseInt(result.feeds[stateslength-1][`field${i}`]));
               }
               setStates(states);
               console.log(result)
               setDName(result.channel.name);
               setFields(fields);
               setLoading(false);
           } catch (error) {
               console.error('Błąd podczas pobierania danych:', error);
               setLoading(false);
           }
       };
useEffect(() => {
    // Fetch data immediately
    fetchData().then(r => console.log('Data fetched'));

    // Then fetch data every 5 seconds
    const interval = setInterval(() => {
        fetchData().then(r => console.log('Data refreshed'));
    }, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
}, []);

    // Fetch data when states changes
    useEffect(() => {

    }, [states]);

    if (loading) {
        return (
            <div>
                <p>Ładowanie danych...</p>
            </div>
        )
    }

return (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="h5" component="div">
        {dname}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 1, m: 1 }}>
        {fields.map((field, index) => (
          <Button variant="contained" color={states[index] ? "success" : "error"} onClick={() => handleButtonClick(index)} key={index}>
            {field}
          </Button>
        ))}
      </Box>
    </CardContent>
  </Card>
);
}

export default DeviceNames;

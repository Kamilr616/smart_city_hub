import {Box, Card, CardContent, Typography} from "@mui/material";

export const DeviceCard = () => {
  return (
    <Box width='300px'>
      <Card>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            Building 1
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lizards are a widespread group of squamate reptiles, with over 6,000
            species, ranging across all continents except Antarctica
          </Typography>
        </CardContent>
    </Card>
    </Box>
  )
}

import React from 'react';
import { Box, Typography, Slider, Paper } from '@mui/material';

const TargetingStep = ({ radius, onRadiusChange }) => {
  const handleSliderChange = (event, newValue) => {
    onRadiusChange(newValue);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Set Targeting Radius</Typography>
      <Paper variant="outlined" sx={{ padding: 3, mt: 2 }}>
        <Typography id="radius-slider-label" gutterBottom>
          Targeting Radius: {radius} miles
        </Typography>
        <Slider
          aria-labelledby="radius-slider-label"
          value={radius}
          onChange={handleSliderChange}
          step={1}
          min={1}
          max={50}
          valueLabelDisplay="auto"
        />
      </Paper>
    </Box>
  );
};

export default TargetingStep; 
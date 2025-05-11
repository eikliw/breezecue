import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';

const REGION_OPTIONS = [
  'Southeast',
  'Northeast',
  'Midwest',
  'West',
  'Southwest',
];

const OnboardingDialog = ({ open, onSave }) => {
  const [selectedRegion, setSelectedRegion] = useState('');

  const handleRegionChange = (event) => {
    setSelectedRegion(event.target.value);
  };

  const handleSave = () => {
    if (selectedRegion) {
      onSave(selectedRegion);
    }
  };

  return (
    <Dialog open={open} onClose={() => {}} /* Prevent closing by clicking outside or Escape */ disableEscapeKeyDown>
      <DialogTitle>Select Your Home Region</DialogTitle>
      <DialogContent sx={{ paddingTop: '16px !important' }}>
        <FormControl fullWidth>
          <InputLabel id="home-region-select-label">Home Region</InputLabel>
          <Select
            labelId="home-region-select-label"
            id="home-region-select"
            value={selectedRegion}
            label="Home Region"
            onChange={handleRegionChange}
          >
            {REGION_OPTIONS.map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} disabled={!selectedRegion} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingDialog; 
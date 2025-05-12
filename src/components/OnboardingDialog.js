import React, { useState, useEffect } from 'react';
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
  Typography,
  Box
} from '@mui/material';

const REGION_OPTIONS = [
  'Southeast',
  'Northeast',
  'Midwest',
  'West',
  'Southwest',
];

const BUSINESS_TYPE_OPTIONS = [
  'Roofing',
  'Auto-Glass',
  'HVAC',
  'Landscaping',
  'Snow Removal',
  'Pest Control',
  'Retail Apparel',
  'Events',
  'Insurance',
  'Logistics',
];

const OnboardingDialog = ({ open, onSave, initialStep = 1, existingRegion = '' }) => {
  const [step, setStep] = useState(initialStep);
  const [selectedRegion, setSelectedRegion] = useState(existingRegion);
  const [selectedBusinessType, setSelectedBusinessType] = useState('');

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);
  
  useEffect(() => {
    setSelectedRegion(existingRegion);
  }, [existingRegion]);

  const handleRegionChange = (event) => {
    setSelectedRegion(event.target.value);
  };

  const handleBusinessTypeChange = (event) => {
    setSelectedBusinessType(event.target.value);
  };

  const handleNext = () => {
    if (selectedRegion) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = () => {
    if (selectedRegion && selectedBusinessType) {
      onSave(selectedRegion, selectedBusinessType);
    }
  };
  
  // Reset state if dialog is closed and reopened, or initial step changes
  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setSelectedRegion(existingRegion || '');
      setSelectedBusinessType('');
    }
  }, [open, initialStep, existingRegion]);

  return (
    <Dialog open={open} onClose={() => {}} /* Prevent closing by clicking outside or Escape */ disableEscapeKeyDown>
      {step === 1 && (
        <>
          <DialogTitle>Step 1: Select Your Home Region</DialogTitle>
          <DialogContent sx={{ paddingTop: '16px !important' }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              This helps us tailor weather alerts relevant to your primary area of operation.
            </Typography>
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
            <Button onClick={handleNext} disabled={!selectedRegion} variant="contained">
              Next
            </Button>
          </DialogActions>
        </>
      )}
      {step === 2 && (
        <>
          <DialogTitle>Step 2: Select Your Business Type</DialogTitle>
          <DialogContent sx={{ paddingTop: '16px !important' }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              This will load a starter set of playbook templates relevant to your industry.
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="business-type-select-label">Business Type</InputLabel>
              <Select
                labelId="business-type-select-label"
                id="business-type-select"
                value={selectedBusinessType}
                label="Business Type"
                onChange={handleBusinessTypeChange}
              >
                {BUSINESS_TYPE_OPTIONS.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            {initialStep === 1 && ( // Only show Back if they started from step 1
                <Button onClick={handleBack}>
                 Back
                </Button>
            )}
            <Button onClick={handleSave} disabled={!selectedBusinessType} variant="contained">
              Save & Get Started
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default OnboardingDialog; 
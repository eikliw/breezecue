import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Stepper, Step, StepLabel, Typography, Paper, Button, CircularProgress, Alert as MuiAlert } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAlerts } from '../contexts/AlertsContext';
import { db, auth } from '../firebase'; // Import db and auth
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Import Step Components
import PreviewStep from './PreviewStep';
import TargetingStep from './TargetingStep';
import ConfirmStep from './ConfirmStep';

const steps = ['Preview Alert', 'Set Targeting', 'Confirm & Save'];

const WizardLayout = () => {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { alerts, loadingAlerts, errorAlerts } = useAlerts();

  const [activeStep, setActiveStep] = useState(0);
  const [alertDetails, setAlertDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Campaign Data State - passed to and updated by step components
  const [campaignCopy, setCampaignCopy] = useState({ headline: '', body: '' });
  const [campaignRadius, setCampaignRadius] = useState(10); // Default radius

  useEffect(() => {
    if (!loadingAlerts && alerts.length > 0) {
      const foundAlert = alerts.find(alert => alert.id === alertId);
      if (foundAlert) {
        setAlertDetails(foundAlert);
      } else {
        console.warn(`Alert with ID ${alertId} not found in context.`);
        enqueueSnackbar(`Alert with ID ${alertId} not found.`, { variant: 'warning' });
      }
      setLoadingDetails(false);
    } else if (!loadingAlerts && alerts.length === 0 && !errorAlerts) {
        console.warn(`No alerts available in context to find ID ${alertId}.`);
        setLoadingDetails(false);
    }
  }, [alertId, alerts, loadingAlerts, errorAlerts, navigate, enqueueSnackbar]);

  const handleMockGenerateCopy = () => {
    // Mock Genkit/OpenAI call
    setCampaignCopy({
      headline: `Mock Headline for: ${alertDetails?.properties?.event || 'Alert'}`,
      body: `This is a mock ad body generated based on the alert: ${alertDetails?.properties?.description || 'No description available.'} Target users effectively with this compelling message.`
    });
    enqueueSnackbar('Mock ad copy generated!', { variant: 'info' });
  };

  const handleSaveDraft = async () => {
    if (!auth.currentUser) {
        enqueueSnackbar('You must be logged in to save a draft.', { variant: 'error' });
        return;
    }
    if (!alertDetails) {
        enqueueSnackbar('Alert details are missing, cannot save draft.', { variant: 'error' });
        return;
    }

    setIsSaving(true);
    const campaignDataToSave = {
      uid: auth.currentUser.uid,
      alertId: alertDetails.id,
      alertEvent: alertDetails.properties?.event || 'N/A',
      copy: campaignCopy,
      radius: campaignRadius,
      status: 'Draft',
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'campaigns'), campaignDataToSave);
      enqueueSnackbar('Campaign draft saved successfully!', { variant: 'success' });
      navigate('/campaigns'); // Navigate to a (yet to be created) campaigns list page
    } catch (error) {
      console.error("Error saving campaign draft:", error);
      enqueueSnackbar('Error saving draft. Please try again.', { variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // This is the "Confirm & Save Draft" action
      handleSaveDraft();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <PreviewStep alertDetails={alertDetails} onGenerateCopy={handleMockGenerateCopy} campaignCopy={campaignCopy} />;
      case 1:
        return <TargetingStep radius={campaignRadius} onRadiusChange={setCampaignRadius} />;
      case 2:
        return <ConfirmStep campaignData={{ headline: campaignCopy.headline, body: campaignCopy.body, radius: campaignRadius, alertId: alertDetails?.id }} />;
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  if (loadingDetails || loadingAlerts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress /> <Typography sx={{ ml: 2 }}>Loading wizard...</Typography>
      </Box>
    );
  }

  if (errorAlerts) {
    return <MuiAlert severity="error" sx={{m:2}}>Error loading alert data: {errorAlerts}</MuiAlert>;
  }

  if (!alertDetails) {
    return (
      <Box sx={{ padding: 3, textAlign: 'center' }}>
        <MuiAlert severity="warning">Alert with ID <Typography component="span" fontWeight="bold">{alertId}</Typography> not found. It may have expired or the ID is incorrect.</MuiAlert>
        <Button onClick={() => navigate('/')} sx={{mt: 2}} variant="outlined">Go to Dashboard</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', padding: { xs: 1, sm: 2, md: 3 } }}>
      <Paper elevation={3} sx={{ padding: { xs: 1.5, sm: 2.5, md: 3 } }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ textAlign: 'center' , mb: {xs: 2, md:3}}}>
          Create Ad Campaign for: <Typography component="span" color="primary.main">{alertDetails.properties?.event || 'N/A'}</Typography>
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: {xs:3, md:4} }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{mb: 3, p:2, border: '1px dashed lightgray', borderRadius: '4px', minHeight: '200px'}}>
         {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, mt:2, borderTop: '1px solid #eee' }}>
          <Button color="inherit" disabled={activeStep === 0 || isSaving} onClick={handleBack} sx={{ mr: 1 }}>Back</Button>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={handleNext} variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : (activeStep === steps.length - 1 ? 'Confirm & Save Draft' : 'Next')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default WizardLayout; 
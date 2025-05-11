import React, { useEffect, useState, useCallback } from 'react';
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

// Mock function to simulate API call delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const WizardLayout = () => {
  const { alertId: encodedAlertId } = useParams();
  const alertId = decodeURIComponent(encodedAlertId);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { alerts, loadingAlerts, errorAlerts } = useAlerts();

  const [activeStep, setActiveStep] = useState(0);
  const [alertDetails, setAlertDetails] = useState(null);
  const [loadingInitialAlert, setLoadingInitialAlert] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Consolidated campaign data state
  const [campaignData, setCampaignData] = useState({
    headline: '',
    body: '',
    imageUrl: '',
    radius: 10, // Default radius
  });

  useEffect(() => {
    setLoadingInitialAlert(true);
    if (!loadingAlerts && alerts.length > 0) {
      const foundAlert = alerts.find(alert => alert.id === alertId);
      if (foundAlert) {
        setAlertDetails(foundAlert);
      } else {
        console.warn(`Alert with ID ${alertId} not found in context.`);
        enqueueSnackbar(`Alert with ID ${alertId} not found. It may have expired.`, { variant: 'warning' });
      }
      setLoadingInitialAlert(false);
    } else if (!loadingAlerts && alerts.length === 0 && !errorAlerts) {
        console.warn(`No alerts available in context to find ID ${alertId}.`);
        setLoadingInitialAlert(false);
    }
  }, [alertId, alerts, loadingAlerts, errorAlerts, enqueueSnackbar]);

  const handleCampaignDataChange = useCallback((newData) => {
    setCampaignData(prevData => ({ ...prevData, ...newData }));
  }, []);

  const handleGenerateAICopy = async () => {
    if (!alertDetails) {
        enqueueSnackbar('Alert details not loaded yet.', { variant: 'error' });
        return;
    }
    setIsGeneratingAI(true);
    // Mock Genkit/OpenAI text call
    await sleep(1500); // Simulate API latency
    const mockHeadline = `ALERT: ${alertDetails.properties?.event || 'Weather Event'} in ${alertDetails.properties?.areaDesc || 'your area'}! Stay safe! (Mock)`;
    const mockBody = `Important NWS update for ${alertDetails.properties?.event}: ${alertDetails.properties?.description || 'Take necessary precautions.'} This is a mock ad. Visit our site for safety tips!`;
    
    // Mock Images API call
    await sleep(1000);
    const mockImageUrl = `https://picsum.photos/seed/${Date.now()}/600/400`; // Random image

    setCampaignData(prev => ({ 
        ...prev,
        headline: mockHeadline.substring(0,90),
        body: mockBody.substring(0,180),
        imageUrl: mockImageUrl 
    }));
    enqueueSnackbar('Mock AI content generated!', { variant: 'info' });
    setIsGeneratingAI(false);
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
      copy: { // Save headline and body under 'copy' object
        headline: campaignData.headline,
        description: campaignData.body, // Save body as description in Firestore as per original request
      },
      imageUrl: campaignData.imageUrl,
      radius: campaignData.radius,
      status: 'Draft',
      createdAt: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, 'campaigns'), campaignDataToSave);
      enqueueSnackbar('Campaign draft saved successfully!', { variant: 'success' });
      navigate('/campaigns');
    } catch (error) {
      console.error("Error saving campaign draft:", error);
      enqueueSnackbar('Error saving draft. Please try again.', { variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) handleSaveDraft();
    else setActiveStep((prev) => prev + 1);
  };
  const handleBack = () => setActiveStep((prev) => prev - 1);
  
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <PreviewStep 
                    alertDetails={alertDetails} 
                    onGenerateAICopy={handleGenerateAICopy} 
                    campaignData={campaignData} 
                    onCampaignDataChange={handleCampaignDataChange}
                    isGenerating={isGeneratingAI}
                />;
      case 1:
        return <TargetingStep radius={campaignData.radius} onRadiusChange={(r) => handleCampaignDataChange({ radius: r })} />;
      case 2:
        return <ConfirmStep campaignData={{ ...campaignData, alertId: alertDetails?.id }} />;
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  if (loadingInitialAlert || loadingAlerts) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /> <Typography sx={{ ml: 2 }}>Loading wizard...</Typography></Box>;
  }
  if (errorAlerts) return <MuiAlert severity="error" sx={{m:2}}>Error loading alert data: {errorAlerts}</MuiAlert>;
  if (!alertDetails) return (
    <Box sx={{ padding: 3, textAlign: 'center' }}><MuiAlert severity="warning">Alert with ID <Typography component="span" fontWeight="bold">{alertId}</Typography> not found.</MuiAlert><Button onClick={() => navigate('/')} sx={{mt: 2}} variant="outlined">Go to Dashboard</Button></Box>
  );

  return (
    <Box sx={{ width: '100%', padding: { xs: 1, sm: 2, md: 3 } }}>
      <Paper elevation={3} sx={{ padding: { xs: 1.5, sm: 2.5, md: 3 } }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ textAlign: 'center' , mb: {xs: 2, md:3}}}>
          Create Ad: <Typography component="span" color="primary.main">{alertDetails.properties?.event || 'N/A'}</Typography>
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: {xs:3, md:4} }}>
          {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
        </Stepper>
        <Box sx={{mb: 3, p:2, border: '1px dashed lightgray', borderRadius: '4px', minHeight: '200px'}}>
         {getStepContent(activeStep)}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, mt:2, borderTop: '1px solid #eee' }}>
          <Button color="inherit" disabled={activeStep === 0 || isSaving || isGeneratingAI} onClick={handleBack} sx={{ mr: 1 }}>Back</Button>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button onClick={handleNext} variant="contained" disabled={isSaving || isGeneratingAI}>
            {isSaving || isGeneratingAI ? <CircularProgress size={24} /> : (activeStep === steps.length - 1 ? 'Confirm & Save Draft' : 'Next')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default WizardLayout; 
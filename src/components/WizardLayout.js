import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Stepper, Step, StepLabel, Typography, Paper, Button, CircularProgress, Alert as MuiAlert, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';
import { useAlerts } from '../contexts/AlertsContext';
import { db, auth } from '../firebase'; // Import db and auth
import { getFunctions, httpsCallable } from 'firebase/functions'; // Import Firebase Functions SDK
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';

// Import Step Components
import PreviewStep from './PreviewStep';
import TargetingStep from './TargetingStep';
import ConfirmStep from './ConfirmStep';

// Simple hook to listen to the user document (copied from App.js - consider moving to hooks/)
const useUserDoc = (uid) => {
  const [userDoc, setUserDoc] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docExists, setDocExists] = useState(false);

  useEffect(() => {
    if (!uid) {
      setUserDoc(null);
      setLoadingDoc(false);
      setDocExists(false);
      return;
    }
    setLoadingDoc(true);
    const docRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserDoc(snapshot.data());
        setDocExists(true);
      } else {
        setUserDoc(null);
        setDocExists(false);
      }
      setLoadingDoc(false);
    }, (error) => {
      console.error("Error listening to user document:", error);
      setUserDoc(null);
      setLoadingDoc(false);
      setDocExists(false);
    });
    return () => unsubscribe();
  }, [uid]);
  return { userDoc, loadingDoc, docExists };
};

const steps = ['Preview Alert', 'Set Targeting', 'Confirm & Save'];

const WizardLayout = () => {
  const { alertId: encodedAlertId } = useParams();
  const alertId = decodeURIComponent(encodedAlertId);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { alerts, loadingAlerts, errorAlerts } = useAlerts();
  const user = auth.currentUser; // Get current user
  const { userDoc, loadingDoc } = useUserDoc(user?.uid); // Fetch user document

  const [activeStep, setActiveStep] = useState(0);
  const [alertDetails, setAlertDetails] = useState(null);
  const [loadingInitialAlert, setLoadingInitialAlert] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini'); // Add state for AI provider

  // Consolidated campaign data state
  const [campaignData, setCampaignData] = useState({
    headline: '',
    headlines: [], // Changed headline to headlines array
    selectedHeadlineIndex: 0, // To track which headline is selected
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
    if (!alertDetails || !userDoc) {
        enqueueSnackbar('Alert details or user settings not loaded yet.', { variant: 'error' });
        return;
    }
    setIsGeneratingAI(true);
    console.log(`Starting AI generation with ${selectedProvider}...`);

    const functions = getFunctions();
    const generateAdContent = httpsCallable(functions, 'generateAdContent');

    // Prepare data for the cloud function
    const requestData = {
        alertDetails: { // Pass only necessary details, not the whole object if large
            id: alertDetails.id,
            properties: {
                event: alertDetails.properties?.event,
                areaDesc: alertDetails.properties?.areaDesc,
                severity: alertDetails.properties?.severity,
                description: alertDetails.properties?.description,
            }
        },
        userSettings: { // Pass only relevant settings
            companyName: userDoc.companyName,
            businessType: userDoc.businessType,
            contactPhone: userDoc.contactPhone,
            companyWebsite: userDoc.companyWebsite,
            // Add other relevant user settings if needed by the function
        },
        provider: selectedProvider // Pass the selected provider
    };

    try {
        console.log("Calling generateAdContent with data:", requestData);
        const result = await generateAdContent(requestData);
        const data = result.data;

        console.log("Received AI content:", data);

        // Runtime checks for data structure (important in JS)
        if (!data || !data.headlines || !Array.isArray(data.headlines) || data.headlines.length === 0 || typeof data.body !== 'string' || typeof data.imageUrl !== 'string') {
            enqueueSnackbar('Received invalid or incomplete data from AI function.', { variant: 'error' });
            throw new Error("Received invalid or incomplete data from AI function.");
        }

        setCampaignData(prev => ({
            ...prev,
            headlines: data.headlines,
            selectedHeadlineIndex: 0,
            body: data.body,
            imageUrl: data.imageUrl
        }));
        enqueueSnackbar('AI content generated successfully!', { variant: 'success' });

    } catch (error) {
        console.error("Error calling generateAdContent function:", error);
        const message = error.details?.message || error.message || 'Failed to generate AI content.';
        enqueueSnackbar(`Error generating content: ${message}`, { variant: 'error' });
        setCampaignData(prev => ({
            ...prev,
            headlines: [],
            selectedHeadlineIndex: 0,
            body: '',
            imageUrl: ''
        }));
    } finally {
        setIsGeneratingAI(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!auth.currentUser || !alertDetails || loadingDoc || !userDoc) {
      enqueueSnackbar('Cannot save draft: missing user, alert, or settings data.', { variant: 'error' });
      return;
    }
    if (!campaignData.headlines || campaignData.headlines.length === 0) {
      enqueueSnackbar('Please generate ad content first.', { variant: 'warning' });
      return;
    }
    setIsSaving(true);
    const selectedHeadline = campaignData.headlines[campaignData.selectedHeadlineIndex];
    const campaignDataToSave = {
      uid: auth.currentUser.uid,
      alertId: alertDetails.id,
      alertEvent: alertDetails.properties?.event || 'N/A',
      copy: { 
        headline: selectedHeadline, // Save the selected headline
        description: campaignData.body,
      },
      imageUrl: campaignData.imageUrl,
      radius: campaignData.radius,
      status: 'Draft',
      createdAt: serverTimestamp(),
      // Optionally save user settings snapshot at time of creation
      settingsSnapshot: {
          companyName: userDoc.companyName,
          businessType: userDoc.businessType,
          primaryColor: userDoc.brandingPrimaryColor,
          // Add other relevant settings if needed
      }
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
                    selectedProvider={selectedProvider}
                    onProviderChange={setSelectedProvider}
                />;
      case 1:
        return <TargetingStep radius={campaignData.radius} onRadiusChange={(r) => handleCampaignDataChange({ radius: r })} />;
      case 2:
        // Pass selected headline to ConfirmStep
        const finalCampaignData = { 
            ...campaignData, 
            headline: campaignData.headlines ? campaignData.headlines[campaignData.selectedHeadlineIndex] : '', 
            alertId: alertDetails?.id 
        };
        // delete finalCampaignData.headlines; // Clean up if needed
        // delete finalCampaignData.selectedHeadlineIndex;
        return <ConfirmStep campaignData={finalCampaignData} />;
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  if (loadingInitialAlert || loadingAlerts || loadingDoc) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /> <Typography sx={{ ml: 2 }}>Loading wizard...</Typography></Box>;
  }
  if (errorAlerts) return <MuiAlert severity="error" sx={{m:2}}>Error loading alert data: {errorAlerts}</MuiAlert>;
  if (!alertDetails) return (
    <Box sx={{ padding: 3, textAlign: 'center' }}><MuiAlert severity="warning">Alert with ID <Typography component="span" fontWeight="bold">{alertId}</Typography> not found.</MuiAlert><Button onClick={() => navigate('/')} sx={{mt: 2}} variant="outlined">Go to Dashboard</Button></Box>
  );

  return (
    <Box sx={{ width: '100%', padding: { xs: 1, sm: 2, md: 3 } }}>
      <Paper elevation={3} sx={{ padding: { xs: 1.5, sm: 2.5, md: 3 }, position: 'relative' }}>
        <IconButton
          aria-label="close wizard"
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
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
          <Button onClick={handleNext} variant="contained" disabled={isSaving || isGeneratingAI || (activeStep === 0 && (!campaignData.headlines || campaignData.headlines.length === 0))}>
            {isSaving || isGeneratingAI ? <CircularProgress size={24} /> : (activeStep === steps.length - 1 ? 'Confirm & Save Draft' : 'Next')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default WizardLayout; 
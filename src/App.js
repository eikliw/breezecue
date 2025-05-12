import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import WeatherMap from './WeatherMap';
import StormTable from './StormTable';
import RegionSelector from './RegionSelector';
import 'leaflet/dist/leaflet.css';
import { US_REGIONS } from './regions'; // Import US_REGIONS for default

// Firebase imports
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, getDocs, query, collection, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase'; // Assuming firebase.js is in src/

// Custom Hooks, Components, and Context
import useEnsureUserDoc from './hooks/useEnsureUserDoc';
import OnboardingDialog from './components/OnboardingDialog';
import WizardLayout from './components/WizardLayout'; // Import WizardLayout
import { AlertsProvider, useAlerts } from './contexts/AlertsContext'; // Import AlertsProvider and useAlerts
import CampaignsPage from './components/CampaignsPage'; // Import CampaignsPage
import SettingsPage from './components/SettingsPage'; // Import SettingsPage

// React Router
import { Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom';
import { Button, Container, Paper, Typography, Box, CircularProgress, IconButton } from '@mui/material'; // For navigation button and Login UI
import GoogleIcon from '@mui/icons-material/Google'; // For Google Sign-In button

// Simple hook to manage current user state
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loadingAuth };
};

// Simple hook to listen to the user document
const useUserDoc = (uid) => {
  const [userDoc, setUserDoc] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docExists, setDocExists] = useState(false);
  const [userDocRef, setUserDocRef] = useState(null);

  useEffect(() => {
    if (!uid) {
      setUserDoc(null);
      setLoadingDoc(false);
      setDocExists(false);
      setUserDocRef(null);
      return;
    }
    setLoadingDoc(true);
    const docRef = doc(db, 'users', uid);
    setUserDocRef(docRef);
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
      setUserDocRef(null);
    });
    return () => unsubscribe();
  }, [uid]);
  return { userDoc, loadingDoc, docExists, userDocRef };
};

// Main application layout component (previously inline in App)
const MainAppLayout = () => {
  const { alerts, loadingAlerts, errorAlerts } = useAlerts(); // Use alerts from context
  const [selectedRegionKey, setSelectedRegionKey] = useState('ALL');
  const [selectedEventType, setSelectedEventType] = useState('ALL');

  // SelectedRegionKey is managed here for now, but could be global if needed
  // This component now receives alerts from context, App.js useEffect for fetching is removed/moved to AlertsProvider

  const handleRegionChange = (regionKey) => setSelectedRegionKey(regionKey);
  const handleEventTypeChange = (eventType) => setSelectedEventType(eventType);

  const currentRegion = US_REGIONS[selectedRegionKey];
  const eventTypesForFilter = ['ALL', ...new Set(alerts.map(alert => alert.properties?.event).filter(Boolean))];
  const filteredAlerts = selectedEventType === 'ALL' ? alerts : alerts.filter(alert => alert.properties?.event === selectedEventType);
  const sidebarClassName = selectedRegionKey === 'ALL' ? 'App-sidebar sidebar-wide' : 'App-sidebar';
  
  // The useAuth hook and related logic (OnboardingDialog) will remain in App to control access to MainAppLayout vs WizardLayout

  return (
    <div className="App">
      {/* OnboardingDialog is now rendered in App before routing to MainAppLayout */}
      <header className="App-header">
        <h1>BreezeCue</h1>
        <div className="App-header-nav">
          <Button component={RouterLink} to="/" color="inherit" sx={{color: "white"}}>Dashboard</Button>
          <Button component={RouterLink} to="/campaigns" color="inherit" sx={{color: "white", marginLeft: '10px'}}>Campaigns</Button>
        </div>
        <div className="App-header-settings">
          <IconButton component={RouterLink} to="/settings" color="inherit" sx={{color: "white"}} aria-label="settings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28px" height="28px" aria-hidden="true" focusable="false">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.25 C14.34,2.01,14.12,1.85,13.87,1.85h-3.74c-0.25,0-0.47,0.16-0.53,0.4L9.2,4.71C8.61,4.95,8.08,5.27,7.58,5.65L5.19,4.69 C4.97,4.62,4.72,4.69,4.6,4.91L2.68,8.23c-0.11,0.2-0.06,0.47,0.12,0.61l2.03,1.58C4.77,10.71,4.75,11.02,4.75,11.34 c0,0.32,0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22 l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.45C9.66,21.99,9.88,22.15,10.13,22.15h3.74c0.25,0,0.47-0.16,0.53-0.4 l0.36-2.45c0.59-0.24,1.12-0.56,1.62-0.94l2.39,0.96c0.22,0.07,0.47,0,0.59-0.22l1.92-3.32 C21.94,13.35,21.89,13.08,21.71,12.94z M12,15.6c-1.98,0-3.6-1.61-3.6-3.6s1.61-3.6,3.6-3.6s3.6,1.61,3.6,3.6 S13.98,15.6,12,15.6z"/>
            </svg>
          </IconButton>
          {auth.currentUser && <Button onClick={() => auth.signOut()} color="inherit" sx={{color: "white", marginLeft: '10px'}}>Sign Out</Button>}
        </div>
      </header>
      <main>
        <div className="map-area">
          <WeatherMap selectedRegion={selectedRegionKey} />
        </div>
        <div className={sidebarClassName}>
          <div className="sidebar-controls-row">
            <RegionSelector
              selectedRegion={selectedRegionKey}
              onRegionChange={handleRegionChange}
            />
            {eventTypesForFilter && eventTypesForFilter.length > 1 && (
              <div className="storm-filter-container">
                <label htmlFor="event-type-filter" className="storm-filter-label">Filter by Event:</label>
                <select
                  id="event-type-filter"
                  className="storm-filter-select"
                  value={selectedEventType}
                  onChange={(e) => handleEventTypeChange(e.target.value)}
                >
                  {eventTypesForFilter.map(type => (
                    <option key={type} value={type}>
                      {type === 'ALL' ? 'All Events' : type}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {loadingAlerts && <p>Loading alerts for {currentRegion?.name || 'selected area'}...</p>}
          {errorAlerts && <p style={{color: 'red'}}>{errorAlerts}</p>}
          {!loadingAlerts && !errorAlerts &&
            <StormTable
              alerts={filteredAlerts} // This now comes from useAlerts() via MainAppLayout
              selectedRegion={currentRegion}
              selectedEventType={selectedEventType}
            />
          }
        </div>
      </main>
    </div>
  );
}

function App() {
  useEnsureUserDoc(); // Ensures user doc is created on login
  const { user, loadingAuth } = useAuth();
  const { userDoc, loadingDoc, docExists, userDocRef } = useUserDoc(user?.uid);
  
  const { setAlerts, setLoadingAlerts, setErrorAlerts } = useAlerts();
  const [selectedRegionForFetch, setSelectedRegionForFetch] = useState('ALL'); // Used by fetchAlerts

   useEffect(() => {
    // This effect now sets data in AlertsContext
    const fetchAlerts = async () => {
      const currentRegionDetails = US_REGIONS[selectedRegionForFetch]; // Use state for fetching
      let apiUrl = 'https://api.weather.gov/alerts/active';
      if (selectedRegionForFetch !== 'ALL' && currentRegionDetails?.areaCodes?.length > 0) {
        apiUrl += `?area=${currentRegionDetails.areaCodes.join(',')}`;
      }
      try {
        setLoadingAlerts(true);
        setErrorAlerts(null);
        const response = await axios.get(apiUrl, { headers: { 'Accept': 'application/geo+json' } });
        setAlerts(response.data.features || []);
      } catch (err) {
        console.error(`Error fetching active alerts for ${selectedRegionForFetch}:`, err);
        setErrorAlerts(`Failed to fetch weather alerts. Please try again later.`);
        setAlerts([]);
      } finally {
        setLoadingAlerts(false);
      }
    };
    // For now, let's fetch alerts once on mount, or when selectedRegionForFetch changes
    // This selectedRegionForFetch would ideally be part of context or a global state
    // if WizardLayout or other routes also need to trigger refetches based on different regions.
    // For simplicity with current structure, MainAppLayout has its own selectedRegionKey for display filtering.
    fetchAlerts(); 
  }, [selectedRegionForFetch, setAlerts, setLoadingAlerts, setErrorAlerts]);


  const needsRegionOnboarding = user && !loadingAuth && docExists && !loadingDoc && userDoc && !userDoc.homeRegion;
  const needsBusinessTypeOnboarding = user && !loadingAuth && docExists && !loadingDoc && userDoc && userDoc.homeRegion && !userDoc.businessType;

  const onboardingInitialStep = needsRegionOnboarding ? 1 : (needsBusinessTypeOnboarding ? 2 : 0); // 0 means no onboarding

  const handleSaveOnboarding = async (region, businessType) => {
    if (userDocRef && user) {
      try {
        // 1. Update user document with homeRegion and businessType
        const userUpdateData = {
          updatedAt: serverTimestamp()
        };
        if (region) userUpdateData.homeRegion = region;
        if (businessType) userUpdateData.businessType = businessType;
        
        await updateDoc(userDocRef, userUpdateData);
        console.log('User onboarding data updated!', userUpdateData);

        // 2. Fetch default playbooks for the selected businessType
        if (businessType) {
          const playbooksQuery = query(
            collection(db, 'playbooks_default'),
            where('businessType', '==', businessType)
          );
          const querySnapshot = await getDocs(playbooksQuery);
          const defaultPlaybooks = [];
          querySnapshot.forEach((doc) => {
            defaultPlaybooks.push({ id: doc.id, ...doc.data() });
          });

          console.log(`Found ${defaultPlaybooks.length} default playbooks for ${businessType}`);

          // 3. Copy default playbooks to users/{uid}/playbooks
          if (defaultPlaybooks.length > 0) {
            const batch = writeBatch(db);
            const userPlaybooksColRef = collection(db, 'users', user.uid, 'playbooks');
            
            defaultPlaybooks.forEach(playbook => {
              const newPlaybookRef = doc(userPlaybooksColRef); // Auto-generate ID for new playbook
              const { id, ...playbookData } = playbook; // Exclude original ID if it exists
              batch.set(newPlaybookRef, {
                ...playbookData, // Contains name, trigger, copy, businessType from default
                isDefault: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            });
            await batch.commit();
            console.log('Default playbooks copied to user subcollection.');
          }
        }
      } catch (err) {
        console.error('Error saving onboarding data or copying playbooks:', err);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // User will be redirected or onAuthStateChanged will pick up the new user.
      // useEnsureUserDoc will handle user document creation.
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      // Handle errors here, e.g., show a notification to the user
    }
  };

  if (loadingAuth) {
    return (
      <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading authentication...</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Typography component="h1" variant="h5">
            Welcome to BreezeCue
          </Typography>
          <Box sx={{ mt: 1, mb: 3 }}>
            <Typography color="textSecondary">
              Please sign in to continue.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            fullWidth
            sx={{ backgroundColor: '#4285F4', color: 'white', '&:hover': { backgroundColor: '#357ae8' } }}
          >
            Sign In with Google
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // If user is logged in, but we are still waiting for their document (e.g. first login, doc creation pending)
  if (loadingDoc && !(needsRegionOnboarding || needsBusinessTypeOnboarding) ) {
      return (
        <Container component="main" maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading user data...</Typography>
        </Container>
      );
  }


  return (
    <>
      <OnboardingDialog 
        open={needsRegionOnboarding || needsBusinessTypeOnboarding}
        onSave={handleSaveOnboarding} 
        initialStep={onboardingInitialStep}
        existingRegion={userDoc?.homeRegion || ''}
      />
      {!(needsRegionOnboarding || needsBusinessTypeOnboarding) && ( // Don't render routes until ALL onboarding is complete
        <Routes>
          <Route path="/" element={<MainAppLayout />} />
          <Route path="/wizard/:alertId" element={<WizardLayout />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}

// Wrap App with AlertsProvider so all components can access alerts context
const AppWithProviders = () => (
  <AlertsProvider>
    <App />
  </AlertsProvider>
);

export default AppWithProviders;

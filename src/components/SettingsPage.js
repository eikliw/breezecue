import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Select, MenuItem, Button, Paper, Box, FormControl, InputLabel, 
  CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, 
  List, ListItem, ListItemText, IconButton, TextField, Grid, Divider, Tabs, Tab, Accordion, 
  AccordionSummary, AccordionDetails, Switch, FormControlLabel, Alert, Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import { doc, updateDoc, collection, getDocs, query, where, writeBatch, serverTimestamp, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Adjust path as needed

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

const SettingsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [userDoc, setUserDoc] = useState(null);
  const [loadingUserDoc, setLoadingUserDoc] = useState(true);
  const [userPlaybooks, setUserPlaybooks] = useState([]);
  const [loadingPlaybooks, setLoadingPlaybooks] = useState(true);

  // Business Type state variables
  const [selectedBusinessType, setSelectedBusinessType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [newBusinessType, setNewBusinessType] = useState('');
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState(0);
  
  // Company Profile state variables
  const [companyName, setCompanyName] = useState('');
  const [companyTagline, setCompanyTagline] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
  // Branding state variables
  const [primaryColor, setPrimaryColor] = useState('#1976d2'); // Default MUI blue
  const [secondaryColor, setSecondaryColor] = useState('#dc004e'); // Default MUI pink
  const [logoUrl, setLogoUrl] = useState('');
  const [brandFont, setBrandFont] = useState('Roboto');
  
  // Ad Settings state variables
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeContact, setIncludeContact] = useState(true);
  const [includeTagline, setIncludeTagline] = useState(true);
  
  // Notification state
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(currentUser => {
      if (!currentUser) {
        navigate('/'); // Redirect if not logged in
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeUserDoc = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserDoc(data);
          
          // Set business type from Firestore data
          setSelectedBusinessType(data.businessType || '');
          
          // Set company profile data from Firestore
          setCompanyName(data.companyName || '');
          setCompanyTagline(data.companyTagline || '');
          setCompanyWebsite(data.companyWebsite || '');
          setContactPhone(data.contactPhone || '');
          setContactEmail(data.contactEmail || data.email || '');
          
          // Set branding data from Firestore
          setPrimaryColor(data.brandingPrimaryColor || '#1976d2');
          setSecondaryColor(data.brandingSecondaryColor || '#dc004e');
          setLogoUrl(data.logoUrl || '');
          setBrandFont(data.brandFont || 'Roboto');
          
          // Set ad settings data from Firestore
          setIncludeLogo(data.adIncludeLogo !== undefined ? data.adIncludeLogo : true);
          setIncludeContact(data.adIncludeContact !== undefined ? data.adIncludeContact : true);
          setIncludeTagline(data.adIncludeTagline !== undefined ? data.adIncludeTagline : true);
        } else {
          setUserDoc(null); // Should not happen if onboarding is complete
        }
        setLoadingUserDoc(false);
      });

      const playbooksColRef = collection(db, 'users', user.uid, 'playbooks');
      const unsubscribePlaybooks = onSnapshot(playbooksColRef, (snapshot) => {
        const playbooks = [];
        snapshot.forEach(doc => playbooks.push({ id: doc.id, ...doc.data() }));
        setUserPlaybooks(playbooks);
        setLoadingPlaybooks(false);
      });

      return () => {
        unsubscribeUserDoc();
        unsubscribePlaybooks();
      };
    }
  }, [user]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Business Type related handlers
  const handleBusinessTypeChange = (event) => {
    const newType = event.target.value;
    if (newType !== userDoc?.businessType) {
        setNewBusinessType(newType);
        setConfirmDialogOpen(true);
    } else {
        setSelectedBusinessType(newType); // If they select the same, just update the state
    }
  };

  const handleConfirmChangeBusinessType = async () => {
    setConfirmDialogOpen(false);
    if (!user || !newBusinessType || newBusinessType === userDoc?.businessType) return;

    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);

      // 1. Delete existing playbooks
      const userPlaybooksColRef = collection(db, 'users', user.uid, 'playbooks');
      const existingPlaybooksSnapshot = await getDocs(userPlaybooksColRef);
      const deleteBatch = writeBatch(db);
      existingPlaybooksSnapshot.forEach(doc => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();
      console.log('Existing user playbooks deleted.');

      // 2. Fetch new default playbooks
      const playbooksQuery = query(
        collection(db, 'playbooks_default'),
        where('businessType', '==', newBusinessType)
      );
      const querySnapshot = await getDocs(playbooksQuery);
      const defaultPlaybooks = [];
      querySnapshot.forEach((doc) => {
        defaultPlaybooks.push(doc.data());
      });

      // 3. Add new default playbooks
      if (defaultPlaybooks.length > 0) {
        const addBatch = writeBatch(db);
        defaultPlaybooks.forEach(playbook => {
          const newPlaybookRef = doc(collection(userPlaybooksColRef)); // Auto-ID
          addBatch.set(newPlaybookRef, {
            ...playbook,
            isDefault: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        await addBatch.commit();
        console.log('New default playbooks added.');
      }
      
      // 4. Update user document with new businessType
      await updateDoc(userDocRef, {
        businessType: newBusinessType,
        updatedAt: serverTimestamp(),
      });
      setSelectedBusinessType(newBusinessType); // Update local state
      console.log('Business type updated and playbooks replaced.');
      
      setNotification({
        open: true,
        message: 'Business type updated with new playbooks!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error changing business type or playbooks:', error);
      setNotification({
        open: true,
        message: 'Error updating business type: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Playbook related handlers
  const handleDeletePlaybook = async (playbookId) => {
    if (!user || !playbookId) return;
    if (window.confirm('Are you sure you want to delete this playbook?')) {
        try {
            const playbookDocRef = doc(db, 'users', user.uid, 'playbooks', playbookId);
            await deleteDoc(playbookDocRef);
            console.log(`Playbook ${playbookId} deleted.`);
            setNotification({
              open: true,
              message: 'Playbook deleted successfully',
              severity: 'success'
            });
        } catch (error) {
            console.error('Error deleting playbook:', error);
            setNotification({
              open: true,
              message: 'Error deleting playbook: ' + error.message,
              severity: 'error'
            });
        }
    }
  };

  const handleEditPlaybook = (playbookId) => {
    // To be implemented in the future
    console.log(`Edit playbook ${playbookId} - (Future Implementation)`);
    alert('Editing playbook functionality will be added in a future update.');
  };
  
  // Company profile and branding handlers
  const saveCompanyProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        companyName,
        companyTagline,
        companyWebsite,
        contactPhone,
        contactEmail,
        updatedAt: serverTimestamp(),
      });
      setNotification({
        open: true,
        message: 'Company profile updated successfully!',
        severity: 'success'
      });
      console.log('Company profile updated');
    } catch (error) {
      console.error('Error updating company profile:', error);
      setNotification({
        open: true,
        message: 'Error updating company profile: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveBrandingSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        brandingPrimaryColor: primaryColor,
        brandingSecondaryColor: secondaryColor,
        logoUrl,
        brandFont,
        updatedAt: serverTimestamp(),
      });
      setNotification({
        open: true,
        message: 'Branding settings updated successfully!',
        severity: 'success'
      });
      console.log('Branding settings updated');
    } catch (error) {
      console.error('Error updating branding settings:', error);
      setNotification({
        open: true,
        message: 'Error updating branding settings: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveAdSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        adIncludeLogo: includeLogo,
        adIncludeContact: includeContact,
        adIncludeTagline: includeTagline,
        updatedAt: serverTimestamp(),
      });
      setNotification({
        open: true,
        message: 'Ad settings updated successfully!',
        severity: 'success'
      });
      console.log('Ad settings updated');
    } catch (error) {
      console.error('Error updating ad settings:', error);
      setNotification({
        open: true,
        message: 'Error updating ad settings: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  // Loading state
  if (loadingUserDoc || !userDoc) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Render the settings page with tabs
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, position: 'relative' }}>
      <IconButton 
        aria-label="close" 
        onClick={() => navigate('/')} 
        sx={{
          position: 'absolute',
          right: 32,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Settings
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="settings tabs">
          <Tab label="Business Profile" />
          <Tab label="Branding" />
          <Tab label="Playbooks" />
          <Tab label="Ad Settings" />
        </Tabs>
      </Box>
      
      {/* Business Profile Tab */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" gutterBottom>Business Profile</Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3} sx={{ flex: '1 0 auto' }}>
            {/* Business Type Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Business Type</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={isSaving}>
                    <InputLabel id="business-type-label">Business Type</InputLabel>
                    <Select
                      labelId="business-type-label"
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
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Changing your business type will update your playbook templates.
                  </Typography>
                </Grid>
                {isSaving && (
                  <Grid item>
                    <CircularProgress size={24} />
                  </Grid>
                )}
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Company Information</Typography>
            </Grid>
            
            {/* Company Name and Tagline Row */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Tagline"
                value={companyTagline}
                onChange={(e) => setCompanyTagline(e.target.value)}
                variant="outlined"
                placeholder="Your slogan or tagline"
              />
            </Grid>
            
            {/* Website Row - Full width */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Website"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                variant="outlined"
                placeholder="https://example.com"
              />
            </Grid>
            
            {/* Contact Information Row */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                variant="outlined"
                placeholder="(555) 123-4567"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                variant="outlined"
                placeholder="contact@example.com"
                type="email"
              />
            </Grid>
          </Grid>
          
          {/* Save Button - Outside of the Grid container, at the bottom of the Paper */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, pt: 2, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={saveCompanyProfile}
              disabled={isSaving}
              startIcon={<SaveIcon />}
              size="large"
            >
              {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Company Profile'}
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Branding Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" gutterBottom>Branding</Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3} sx={{ flex: '1 0 auto' }}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Brand Colors</Typography>
            </Grid>
            
            {/* Primary Color Row */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Primary Brand Color</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    mr: 2,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: primaryColor,
                  }}
                />
                <TextField
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#1976d2"
                  variant="outlined"
                  size="small"
                  sx={{ width: 120, mr: 2 }}
                />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: 40, height: 40 }}
                />
              </Box>
            </Grid>
            
            {/* Secondary Color Row */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Secondary Brand Color</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    mr: 2,
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: secondaryColor,
                  }}
                />
                <TextField
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#dc004e"
                  variant="outlined"
                  size="small"
                  sx={{ width: 120, mr: 2 }}
                />
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{ width: 40, height: 40 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Logo & Typography</Typography>
            </Grid>
            
            {/* Logo URL and Preview */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Logo URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                variant="outlined"
                placeholder="https://example.com/logo.png"
                helperText="URL to your company logo image"
              />
              <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
                {logoUrl ? (
                  <Box
                    component="img"
                    src={logoUrl}
                    alt="Company Logo Preview"
                    sx={{ 
                      maxWidth: '100%', 
                      maxHeight: 100,
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: 1,
                      p: 1
                    }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      height: 100, 
                      width: '100%', 
                      maxWidth: 300,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px dashed rgba(0, 0, 0, 0.12)',
                      borderRadius: 1,
                      color: 'text.secondary'
                    }}
                  >
                    <Typography variant="body2">Logo preview will appear here</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            
            {/* Brand Font Selection and Preview - Side by side */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Brand Font</Typography>
              <Grid container spacing={2} alignItems="stretch">
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth>
                    <InputLabel id="font-select-label">Select Font</InputLabel>
                    <Select
                      labelId="font-select-label"
                      value={brandFont}
                      label="Select Font"
                      onChange={(e) => setBrandFont(e.target.value)}
                    >
                      <MenuItem value="Roboto">Roboto (Default)</MenuItem>
                      <MenuItem value="Open Sans">Open Sans</MenuItem>
                      <MenuItem value="Montserrat">Montserrat</MenuItem>
                      <MenuItem value="Lato">Lato</MenuItem>
                      <MenuItem value="Raleway">Raleway</MenuItem>
                      <MenuItem value="Playfair Display">Playfair Display</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      border: '1px solid rgba(0, 0, 0, 0.12)', 
                      borderRadius: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h6" style={{ fontFamily: brandFont, color: primaryColor, fontWeight: 'bold', marginBottom: '8px' }}>
                      Free Roof Inspection After Hail
                    </Typography>
                    <Typography variant="body2" style={{ fontFamily: brandFont }}>
                      This preview shows how your ad headlines will appear
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Save Button - Outside of the Grid container, at the bottom of the Paper */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, pt: 2, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={saveBrandingSettings}
              disabled={isSaving}
              startIcon={<SaveIcon />}
              size="large"
            >
              {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Branding Settings'}
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Playbooks Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>Playbooks</Typography>
          <Divider sx={{ mb: 3 }} />
          
          {loadingPlaybooks ? (
            <CircularProgress />
          ) : userPlaybooks.length > 0 ? (
            <List>
              {userPlaybooks.map((playbook) => (
                <ListItem 
                  key={playbook.id} 
                  divider
                  secondaryAction={
                    <>
                      <IconButton edge="end" aria-label="edit" onClick={() => handleEditPlaybook(playbook.id)} sx={{mr:1}}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeletePlaybook(playbook.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemText 
                    primary={playbook.name} 
                    secondary={`Trigger: ${playbook.trigger}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>You don't have any playbooks yet. Changing your business type will load default playbooks.</Typography>
          )}
        </Paper>
      )}
      
      {/* Ad Settings Tab */}
      {activeTab === 3 && (
        <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" gutterBottom>Ad Settings</Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Content Elements
          </Typography>
          
          <Grid container spacing={3} sx={{ flex: '1 0 auto' }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={includeLogo} 
                    onChange={(e) => setIncludeLogo(e.target.checked)}
                    color="primary"
                  />
                }
                label="Include Company Logo in Ads"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={includeContact} 
                    onChange={(e) => setIncludeContact(e.target.checked)}
                    color="primary"
                  />
                }
                label="Include Contact Information in Ads"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={includeTagline} 
                    onChange={(e) => setIncludeTagline(e.target.checked)}
                    color="primary"
                  />
                }
                label="Include Company Tagline in Ads"
              />
            </Grid>
          </Grid>
          
          {/* Save Button - Outside of the Grid container, at the bottom of the Paper */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, pt: 2, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={saveAdSettings}
              disabled={isSaving}
              startIcon={<SaveIcon />}
              size="large"
            >
              {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Ad Settings'}
            </Button>
          </Box>
        </Paper>
      )}
      
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Business Type Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Changing your business type to "{newBusinessType}" will replace your current playbooks with the default templates for this new type. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleConfirmChangeBusinessType} color="primary" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} color="inherit"/> : "Yes, Replace Playbooks"}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SettingsPage; 
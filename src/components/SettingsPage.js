import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Select, MenuItem, Button, Paper, Box, FormControl, InputLabel, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, List, ListItem, ListItemText, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
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

  const [selectedBusinessType, setSelectedBusinessType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [newBusinessType, setNewBusinessType] = useState('');

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
          setSelectedBusinessType(data.businessType || '');
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

    } catch (error) {
      console.error('Error changing business type or playbooks:', error);
      // Add user-facing error handling here
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlaybook = async (playbookId) => {
    if (!user || !playbookId) return;
    if (window.confirm('Are you sure you want to delete this playbook?')) {
        try {
            const playbookDocRef = doc(db, 'users', user.uid, 'playbooks', playbookId);
            await deleteDoc(playbookDocRef);
            console.log(`Playbook ${playbookId} deleted.`);
        } catch (error) {
            console.error('Error deleting playbook:', error);
        }
    }
  };

  const handleEditPlaybook = (playbookId) => {
    // To be implemented in the future
    console.log(`Edit playbook ${playbookId} - (Future Implementation)`);
    alert('Editing playbook functionality will be added in a future update.');
  };

  if (loadingUserDoc || !userDoc) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Settings
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>My Business Type</Typography>
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
          {isSaving && <CircularProgress size={24} sx={{ ml: 2, verticalAlign: 'middle' }} />}
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          My Playbooks
        </Typography>
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

    </Container>
  );
};

export default SettingsPage; 
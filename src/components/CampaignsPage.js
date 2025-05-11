import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Chip, CircularProgress, Alert as MuiAlert, Avatar } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useSnackbar } from 'notistack';
import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/RocketLaunch'; // RocketLaunch is a good fit for "Launch"
import ImageIcon from '@mui/icons-material/Image'; // Placeholder icon

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      enqueueSnackbar('You need to be logged in to view campaigns.', { variant: 'warning' });
      setLoading(false);
      // Optionally navigate to login page
      // navigate('/login'); 
      return;
    }

    setLoading(true);
    const campaignsRef = collection(db, 'campaigns');
    const q = query(
      campaignsRef,
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const campaignsData = [];
      querySnapshot.forEach((doc) => {
        campaignsData.push({ id: doc.id, ...doc.data() });
      });
      setCampaigns(campaignsData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching campaigns:", err);
      setError("Failed to fetch campaigns. Please try again later.");
      enqueueSnackbar('Error fetching campaigns.', { variant: 'error' });
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [currentUser, enqueueSnackbar]);

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign draft?")) return;
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      enqueueSnackbar('Campaign deleted successfully.', { variant: 'success' });
    } catch (err) {
      console.error("Error deleting campaign:", err);
      enqueueSnackbar('Error deleting campaign.', { variant: 'error' });
    }
  };

  const handleLaunchCampaign = async (id) => {
    // Later this will call Google Ads API
    try {
      await updateDoc(doc(db, 'campaigns', id), { status: 'Launched' });
      enqueueSnackbar('Campaign status updated to Launched!', { variant: 'success' });
    } catch (err) {
      console.error("Error launching campaign:", err);
      enqueueSnackbar('Error updating campaign status.', { variant: 'error' });
    }
  };

  const getStatusChip = (status) => {
    let color = 'default';
    if (status === 'Draft') color = 'info';
    else if (status === 'Launched') color = 'success';
    else if (status === 'Error') color = 'error';
    return <Chip label={status} color={color} size="small" />;
  };

  const columns = [
    {
        field: 'imageUrl',
        headerName: 'Ad',
        width: 80,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
            <Tooltip title={params.row.copy?.headline || 'Ad Visual'}>
                <Avatar 
                    src={params.value}
                    alt={params.row.copy?.headline || 'Ad visual'}
                    variant="rounded"
                    sx={{ width: 56, height: 56, cursor: 'pointer' }}
                    onClick={() => params.value && window.open(params.value, '_blank')} // Open image in new tab
                >
                    {!params.value && <ImageIcon />} { /* Placeholder if no image */}
                </Avatar>
            </Tooltip>
        )
    },
    { field: 'alertEvent', headerName: 'Alert Type', flex: 0.8, minWidth: 130 },
    { 
      field: 'copy.headline',
      headerName: 'Headline',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (params) => params.row.copy?.headline || 'N/A',
    },
    { 
      field: 'radius',
      headerName: 'Radius',
      width: 90,
      valueFormatter: (params) => `${params.value} mi`,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 170,
      type: 'dateTime',
      valueGetter: (params) => params.value?.toDate(), // for sorting/filtering
      valueFormatter: (params) => params.value ? new Date(params.value.toDate()).toLocaleString() : 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Launch Campaign">
            <span> {/* Span needed for disabled IconButton Tooltip to work */} 
              <IconButton 
                onClick={() => handleLaunchCampaign(params.row.id)} 
                color="success"
                disabled={params.row.status === 'Launched'} // Disable if already launched
              >
                <LaunchIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete Campaign">
            <IconButton onClick={() => handleDeleteCampaign(params.row.id)} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress /> <Typography sx={{ ml: 2 }}>Loading campaigns...</Typography>
      </Box>
    );
  }

  if (error) {
    return <MuiAlert severity="error" sx={{m:2}}>{error}</MuiAlert>;
  }
  
  if (!currentUser) {
      return (
        <Box sx={{ padding: 3, textAlign: 'center' }}>
            <MuiAlert severity="warning">Please log in to view your campaigns.</MuiAlert>
            {/* Optionally, add a login button here */}
        </Box>
      );
  }

  return (
    <Box sx={{ padding: { xs: 1, sm: 2, md: 3 }, height: 'calc(100vh - 100px)', width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: {xs: 2, md:3} }}>
        My Campaigns
      </Typography>
      <Paper sx={{ height: 'calc(100% - 48px)', width: '100%' }} elevation={2}>
        {campaigns.length === 0 && !loading ? (
            <Box sx={{textAlign: 'center', p:3}}>
                <Typography>No campaigns found. Create one from the dashboard!</Typography>
            </Box>
        ) : (
        <DataGrid
          rows={campaigns}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          checkboxSelection={false} // Disable checkbox selection if not needed
          disableSelectionOnClick
          autoHeight={false} // Set to false to fill Paper height
          sx={{ border: 0 }} // Remove default border if Paper provides one
        />
        )}
      </Paper>
    </Box>
  );
};

export default CampaignsPage; 
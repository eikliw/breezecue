import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const ConfirmStep = ({ campaignData }) => {
  const { headline, body, imageUrl, radius, alertId } = campaignData;

  // Structure matches what will be saved (mostly), for user review.
  // Note: In Firestore, body is saved as copy.description.
  const payloadToDisplay = {
    alertId: alertId || 'N/A',
    adCopy: {
        headline: headline || 'N/A',
        body: body || 'N/A', // Displaying 'body' as it is in local state before save
    },
    imageUrl: imageUrl || 'N/A',
    targetingRadius: radius ? `${radius} mi` : 'N/A',
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Confirm Campaign Details</Typography>
      <Paper variant="outlined" sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Campaign Details for Review:</Typography>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#f5f5f5', padding: '10px', borderRadius: '4px', maxHeight: '300px', overflowY: 'auto'}}>
          {JSON.stringify(payloadToDisplay, null, 2)}
        </pre>
        {imageUrl && (
            <Box mt={2}>
                <Typography variant="subtitle2">Image Preview:</Typography>
                <img src={imageUrl} alt="Ad visual preview" style={{ width: '100%', maxWidth: '200px', height: 'auto', marginTop: '8px', borderRadius: '4px' }} />
            </Box>
        )}
      </Paper>
      {/* The actual save button is the main "Next" button in WizardLayout when on the last step */}
      {/* This component primarily displays information. The onSaveDraft logic is triggered by WizardLayout's main action button */}
      <Typography variant="body2">Click "Confirm & Save Draft" below to save this campaign.</Typography>
    </Box>
  );
};

export default ConfirmStep; 
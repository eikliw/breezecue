import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

const ConfirmStep = ({ campaignData, onSaveDraft }) => {
  const { headline, body, radius, alertId } = campaignData;

  const payload = {
    headline: headline || 'N/A',
    body: body || 'N/A',
    radius: radius || 0,
    alertId: alertId || 'N/A',
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Confirm Campaign Details</Typography>
      <Paper variant="outlined" sx={{ padding: 2, marginBottom: 2, overflowX: 'auto' }}>
        <Typography variant="subtitle1" gutterBottom>Campaign Payload:</Typography>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#f5f5f5', padding: '10px', borderRadius: '4px'}}>
          {JSON.stringify(payload, null, 2)}
        </pre>
      </Paper>
      {/* The actual save button is the main "Next" button in WizardLayout when on the last step */}
      {/* This component primarily displays information. The onSaveDraft logic is triggered by WizardLayout's main action button */}
      <Typography variant="body2">Click "Confirm & Save Draft" below to save this campaign.</Typography>
    </Box>
  );
};

export default ConfirmStep; 
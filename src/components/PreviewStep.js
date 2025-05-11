import React from 'react';
import { Box, Button, Typography, Paper, Divider } from '@mui/material';

const PreviewStep = ({ alertDetails, onGenerateCopy, campaignCopy }) => {
  if (!alertDetails) {
    return <Typography>No alert details available.</Typography>;
  }

  const { event, headline, description, areaDesc, instruction, senderName, effective, expires, severity, certainty, urgency } = alertDetails.properties;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Alert Preview: {event}</Typography>
      <Paper variant="outlined" sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="subtitle1" gutterBottom component="div"><b>Headline:</b> {headline || 'N/A'}</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" gutterBottom><b>Description:</b> {description || 'N/A'}</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" gutterBottom><b>Area:</b> {areaDesc || 'N/A'}</Typography>
        <Divider sx={{ my: 1 }} />
        {instruction && <><Typography variant="body2" gutterBottom><b>Instruction:</b> {instruction}</Typography><Divider sx={{ my: 1 }} /></>}
        <Typography variant="body2"><b>Effective:</b> {new Date(effective).toLocaleString()}</Typography>
        <Typography variant="body2"><b>Expires:</b> {new Date(expires).toLocaleString()}</Typography>
        <Typography variant="body2"><b>Severity:</b> {severity}</Typography>
        <Typography variant="body2"><b>Certainty:</b> {certainty}</Typography>
        <Typography variant="body2"><b>Urgency:</b> {urgency}</Typography>
        <Typography variant="body2"><b>Sender:</b> {senderName}</Typography>
      </Paper>

      <Button variant="contained" onClick={onGenerateCopy} sx={{ mb: 2 }}>
        Generate Ad Copy (Mock)
      </Button>

      { (campaignCopy.headline || campaignCopy.body) &&
        <Paper variant="outlined" sx={{ padding: 2, backgroundColor: '#f9f9f9'}}>
            <Typography variant="subtitle1" gutterBottom>Generated Ad Copy:</Typography>
            <Typography variant="body1" gutterBottom><b>Headline:</b> {campaignCopy.headline || "(Not generated)"}</Typography>
            <Typography variant="body2"><b>Body:</b> {campaignCopy.body || "(Not generated)"}</Typography>
        </Paper>
      }
    </Box>
  );
};

export default PreviewStep; 
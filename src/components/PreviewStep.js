import React from 'react';
import { Box, Button, Typography, Paper, Divider, TextField, CircularProgress } from '@mui/material';

const PreviewStep = ({ alertDetails, onGenerateAICopy, campaignData, onCampaignDataChange, isGenerating }) => {
  if (!alertDetails) {
    return <Typography>No alert details available.</Typography>;
  }

  const { event, headline: alertHeadline, description: alertDescription, areaDesc, instruction, senderName, effective, expires, severity, certainty, urgency } = alertDetails.properties;

  const handleInputChange = (e) => {
    onCampaignDataChange({ ...campaignData, [e.target.name]: e.target.value });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Alert Preview: {event}</Typography>
      <Paper variant="outlined" sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="subtitle1" gutterBottom component="div"><b>Original Alert Headline:</b> {alertHeadline || 'N/A'}</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography variant="body2" gutterBottom><b>Original Alert Description:</b> {alertDescription || 'N/A'}</Typography>
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

      <Button variant="contained" onClick={onGenerateAICopy} sx={{ mb: 2 }} disabled={isGenerating}>
        {isGenerating ? <CircularProgress size={24} sx={{mr:1}} /> : null}
        {campaignData.headline || campaignData.imageUrl ? 'Regenerate AI Content' : 'Generate AI Content (Mock)'}
      </Button>

      { (campaignData.headline || campaignData.body || campaignData.imageUrl) &&
        <Paper variant="outlined" sx={{ padding: 2, backgroundColor: '#f9f9f9'}}>
            <Typography variant="subtitle1" gutterBottom>Generated Ad Content:</Typography>
            <TextField
                label="Ad Headline"
                name="headline"
                value={campaignData.headline || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                inputProps={{ maxLength: 90 }}
                helperText={`${campaignData.headline?.length || 0}/90 chars`}
            />
            <TextField
                label="Ad Body/Description"
                name="body"
                value={campaignData.body || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                margin="normal"
                inputProps={{ maxLength: 180 }}
                helperText={`${campaignData.body?.length || 0}/180 chars`}
            />
            {campaignData.imageUrl && (
                <Box mt={2}>
                    <Typography variant="subtitle2">Generated Image Preview:</Typography>
                    <img src={campaignData.imageUrl} alt="Generated ad visual" style={{ width: '100%', maxWidth: '300px', height: 'auto', marginTop: '8px', borderRadius: '4px' }} />
                </Box>
            )}
        </Paper>
      }
    </Box>
  );
};

export default PreviewStep; 
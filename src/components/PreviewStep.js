import React from 'react';
import { Box, Button, Typography, Paper, Divider, TextField, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const PreviewStep = ({ alertDetails, onGenerateAICopy, campaignData, onCampaignDataChange, isGenerating, selectedProvider, onProviderChange }) => {
  if (!alertDetails) {
    return <Typography>No alert details available.</Typography>;
  }

  const { event, headline: alertHeadline, description: alertDescription, areaDesc, instruction, senderName, effective, expires, severity, certainty, urgency } = alertDetails.properties;

  const handleInputChange = (e) => {
    onCampaignDataChange({ ...campaignData, [e.target.name]: e.target.value });
  };

  const handleProviderChange = (event) => {
    onProviderChange(event.target.value);
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

      <FormControl size="small" sx={{ minWidth: 150, mr: 2, mb: {xs: 1, sm: 0} }} disabled={isGenerating}>
        <InputLabel id="ai-provider-select-label">AI Provider</InputLabel>
        <Select
          labelId="ai-provider-select-label"
          id="ai-provider-select"
          value={selectedProvider}
          label="AI Provider"
          onChange={handleProviderChange}
        >
          <MenuItem value="gemini">Google Gemini</MenuItem>
          <MenuItem value="openai">OpenAI (GPT-4o)</MenuItem>
        </Select>
      </FormControl>

      <Button variant="contained" onClick={onGenerateAICopy} sx={{ mb: 2, verticalAlign: 'middle' }} disabled={isGenerating}>
        {isGenerating ? <CircularProgress size={24} sx={{mr:1}} /> : null}
        {campaignData.headlines && campaignData.headlines.length > 0 ? 'Regenerate AI Content' : 'Generate AI Content'}
      </Button>

      { campaignData.headlines && campaignData.headlines.length > 0 &&
        <Paper variant="outlined" sx={{ padding: 2, backgroundColor: '#f9f9f9'}}>
            <Typography variant="subtitle1" gutterBottom>Generated Ad Content:</Typography>

            <FormControl fullWidth margin="normal">
                <InputLabel id="headline-select-label">Select Headline</InputLabel>
                <Select
                    labelId="headline-select-label"
                    id="headline-select"
                    value={campaignData.selectedHeadlineIndex ?? 0}
                    label="Select Headline"
                    onChange={(e) => onCampaignDataChange({ selectedHeadlineIndex: e.target.value })}
                >
                    {campaignData.headlines.map((headline, index) => (
                        <MenuItem key={index} value={index}>
                            {headline} ({headline.length}/90 chars)
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

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
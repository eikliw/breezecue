import React from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Icon } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

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

  const platformSpecs = {
    google: { headline_len: 30, desc_len: 90, image_ratio: "1.91:1" },
    facebook: { primary_text_len: 125, headline_len: 40, image_ratio: "1:1" }, // FB uses primary_text for longer body
  };

  const checkSpec = (textLength, limit) => {
    return textLength <= limit ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />;
  };

  const handleExport = async () => {
    const zip = new JSZip();

    // Add text files
    if (headline) zip.file("headline.txt", headline);
    if (body) zip.file("description.txt", body);

    // Add settings.json
    const settingsContent = JSON.stringify({
        platformGuidance: platformSpecs,
        campaignDetails: {
            alertId: alertId,
            targetingRadius: radius,
            sourceHeadline: headline,
            sourceDescription: body,
            sourceImageUrl: imageUrl,
        }
    }, null, 2);
    zip.file("settings.json", settingsContent);

    // Fetch and add image (mocked blob fetch)
    if (imageUrl) {
      try {
        // In a real app, fetch(imageUrl) might have CORS issues for external URLs.
        // A proxy or direct SDK download (if from a service like Firebase Storage) is better.
        // For picsum.photos, it generally allows direct fetching.
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const imageBlob = await response.blob();
        
        // Determine file extension (basic example)
        let imageExtension = '.jpg';
        if (imageBlob.type === 'image/png') imageExtension = '.png';
        else if (imageBlob.type === 'image/gif') imageExtension = '.gif';
        // Add more types as needed

        zip.file(`image${imageExtension}`, imageBlob);
      } catch (error) {
        console.error("Error fetching image for ZIP:", error);
        // Optionally notify user that image couldn't be included
        alert("Could not fetch image for download. Other files will be zipped.");
      }
    }

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, `ad_package_${alertId || 'campaign'}.zip`);
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Confirm Campaign Details</Typography>
      <Paper variant="outlined" sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Campaign Details for Review:</Typography>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#f5f5f5', padding: '10px', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto'}}>
          {JSON.stringify(payloadToDisplay, null, 2)}
        </pre>
        {imageUrl && (
            <Box mt={2} mb={2}>
                <Typography variant="subtitle2">Image Preview:</Typography>
                <img src={imageUrl} alt="Ad visual preview" style={{ width: '100%', maxWidth: '200px', height: 'auto', marginTop: '8px', borderRadius: '4px' }} />
            </Box>
        )}
        <Button variant="contained" onClick={handleExport} size="small" sx={{mt: 1}}>
            Export Ad Package (.zip)
        </Button>
      </Paper>

      <Typography variant="h6" gutterBottom sx={{mt: 3}}>Platform Spec Checks</Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Platform</TableCell>
              <TableCell>Metric</TableCell>
              <TableCell align="right">Length</TableCell>
              <TableCell align="center">Recommended</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Google Ads */}
            <TableRow>
              <TableCell rowSpan={2}>Google Ads</TableCell>
              <TableCell>Headline</TableCell>
              <TableCell align="right">{headline?.length || 0}</TableCell>
              <TableCell align="center">{platformSpecs.google.headline_len}</TableCell>
              <TableCell align="center">{checkSpec(headline?.length || 0, platformSpecs.google.headline_len)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell align="right">{body?.length || 0}</TableCell>
              <TableCell align="center">{platformSpecs.google.desc_len}</TableCell>
              <TableCell align="center">{checkSpec(body?.length || 0, platformSpecs.google.desc_len)}</TableCell>
            </TableRow>
            {/* Facebook Ads */}
            <TableRow>
              <TableCell rowSpan={2}>Facebook Ads</TableCell>
              <TableCell>Headline</TableCell>
              <TableCell align="right">{headline?.length || 0}</TableCell>
              <TableCell align="center">{platformSpecs.facebook.headline_len}</TableCell>
              <TableCell align="center">{checkSpec(headline?.length || 0, platformSpecs.facebook.headline_len)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Primary Text (Body)</TableCell>
              <TableCell align="right">{body?.length || 0}</TableCell>
              <TableCell align="center">{platformSpecs.facebook.primary_text_len}</TableCell>
              <TableCell align="center">{checkSpec(body?.length || 0, platformSpecs.facebook.primary_text_len)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="body2" sx={{mt: 3}}>Click "Confirm & Save Draft" below to save this campaign.</Typography>
    </Box>
  );
};

export default ConfirmStep; 
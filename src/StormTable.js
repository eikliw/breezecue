import React from 'react';
import { Link } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

// Define colors for common storm event types
const STORM_EVENT_COLORS = {
  // Warnings (Generally Red/Orange/Pink hues)
  'Tornado Warning': '#FF0000', // Red
  'Severe Thunderstorm Warning': '#FFA500', // Orange
  'Flash Flood Warning': '#00FF00', // Lime Green (Often used for FF)
  'Flood Warning': '#228B22', // Forest Green
  'Extreme Wind Warning': '#FF1493', // Deep Pink
  'Hurricane Warning': '#DC143C', // Crimson
  'Tropical Storm Warning': '#FF4500', // OrangeRed
  'Blizzard Warning': '#ADD8E6', // Light Blue
  'Winter Storm Warning': '#FF69B4', // Hot Pink
  'Ice Storm Warning': '#DB7093', // Pale Violet Red
  'High Wind Warning': '#DAA520', // Goldenrod
  'Red Flag Warning': '#B22222', // Firebrick

  // Watches (Generally Yellow/Amber hues)
  'Tornado Watch': '#FFFF00', // Yellow
  'Severe Thunderstorm Watch': '#FFD700', // Gold
  'Flash Flood Watch': '#90EE90', // Light Green
  'Flood Watch': '#8FBC8F', // Dark Sea Green
  'Hurricane Watch': '#FF8C00', // Dark Orange
  'Tropical Storm Watch': '#FFA07A', // Light Salmon
  'Winter Storm Watch': '#FFB6C1', // Light Pink
  'High Wind Watch': '#F4A460', // Sandy Brown

  // Advisories (Generally Blue/Gray/Purple hues)
  'Wind Advisory': '#B0C4DE', // Light Steel Blue
  'Winter Weather Advisory': '#E6E6FA', // Lavender
  'Flood Advisory': '#AFEEEE', // Pale Turquoise
  'Dense Fog Advisory': '#D3D3D3', // Light Gray
  'Heat Advisory': '#FF7F50', // Coral
  'Coastal Flood Advisory': '#4682B4', // Steel Blue
  'Special Weather Statement': '#D8BFD8', // Thistle

  // Default
  default: '#F5F5F5' // Whitesmoke (very light gray)
};

// Helper function to get color and determine text color for contrast
const getEventCellStyle = (event) => {
  const bgColor = STORM_EVENT_COLORS[event] || STORM_EVENT_COLORS.default;
  // Simple brightness check (adjust threshold as needed)
  // Formula: (0.299*R + 0.587*G + 0.114*B)
  let textColor = '#000000'; // Default to black text
  if (bgColor.startsWith('#')) {
    const hex = bgColor.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    if (brightness < 128) { // If background is dark
      textColor = '#FFFFFF'; // Use white text
    }
  }
  
  return {
    backgroundColor: bgColor,
    color: textColor,
    fontWeight: '500' // Slightly bolder event text
  };
};

// Props are now just 'alerts' and 'selectedEventType' (for the message)
function StormTable({ alerts, selectedEventType }) { 
  // The 'selectedEventType' prop is only needed for the no-alerts message now.
  // If 'alerts' is empty, it means either no alerts for the region or filter cleared them.

  return (
    <div>
      <h3>Current Storm Warnings & Watches</h3>
      
      {/* Filter UI has been moved to App.js */}

      {(!alerts || alerts.length === 0) ? (
        <p className="no-alerts-message">
          {/* Adjust message based on whether a filter is active (known from App.js) */}
          {/* For simplicity, we'll pass selectedEventType to know if 'ALL' or specific */}
          {selectedEventType && selectedEventType === 'ALL' 
            ? "No active alerts at the moment for the selected region/filters."
            : `No active '${selectedEventType}' alerts for the selected region/filters.`}
        </p>
      ) : (
        <table className="storm-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Headline</th>
              <th>Area</th>
              <th>Severity</th>
              <th>Effective</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, index) => {
              const eventType = alert.properties?.event || 'Unknown';
              const cellStyle = getEventCellStyle(eventType);
              return (
                <tr key={alert.id || index}>
                  <td style={cellStyle}>{eventType}</td>
                  <td>{alert.properties?.headline || 'N/A'}</td>
                  <td>{alert.properties?.areaDesc}</td>
                  <td>{alert.properties?.severity}</td>
                  <td>{new Date(alert.properties?.effective).toLocaleString()}</td>
                  <td style={{ textAlign: 'center'}}>
                    <Tooltip title="Create Ad Campaign">
                      <IconButton 
                        component={Link} 
                        to={`/wizard/${encodeURIComponent(alert.id)}`} 
                        color="primary"
                        aria-label={`Create ad campaign for ${eventType}`}
                      >
                        <AutoFixHighIcon />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StormTable;

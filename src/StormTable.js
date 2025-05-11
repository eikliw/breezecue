import React from 'react';
import { Link } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

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
            ? "No active alerts at the moment for the selected region."
            : `No active '${selectedEventType}' alerts for the selected region.`}
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
            {alerts.map((alert, index) => (
              <tr key={alert.id || index}>
                <td>{alert.properties?.event}</td>
                <td>{alert.properties?.headline || 'N/A'}</td>
                <td>{alert.properties?.areaDesc}</td>
                <td>{alert.properties?.severity}</td>
                <td>{new Date(alert.properties?.effective).toLocaleString()}</td>
                <td style={{ textAlign: 'center'}}>
                  <Tooltip title="Create Ad Campaign">
                    <IconButton 
                      component={Link} 
                      to={`/wizard/${alert.id}`} 
                      color="primary"
                      aria-label={`Create ad campaign for ${alert.properties?.event}`}
                    >
                      <AutoFixHighIcon />
                    </IconButton>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StormTable;

import React from 'react';

// Props are now just 'alerts' and 'selectedEventType' (for the message)
function StormTable({ alerts, selectedEventType }) { 
  // The 'selectedEventType' prop is only needed for the no-alerts message now.
  // If 'alerts' is empty, it means either no alerts for the region or filter cleared them.

  const handleCreateAdSet = (alert) => {
    console.log("Create Ad Set for:", alert.properties?.headline, alert.id);
    // Placeholder for future functionality
  };

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
                <td>{alert.properties?.headline}</td>
                <td>{alert.properties?.areaDesc}</td>
                <td>{alert.properties?.severity}</td>
                <td>{new Date(alert.properties?.effective).toLocaleString()}</td>
                <td>
                  <button 
                    className="create-ad-set-button" 
                    onClick={() => handleCreateAdSet(alert)}
                  >
                    Create Ad Set
                  </button>
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

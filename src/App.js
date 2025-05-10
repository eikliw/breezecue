import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import WeatherMap from './WeatherMap';
import StormTable from './StormTable';
import RegionSelector from './RegionSelector';
import 'leaflet/dist/leaflet.css';
import { US_REGIONS } from './regions'; // Import US_REGIONS for default

function App() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegionKey, setSelectedRegionKey] = useState('ALL'); // Default to 'ALL'
  const [selectedEventType, setSelectedEventType] = useState('ALL'); // State for event type filter

  useEffect(() => {
    const fetchAlerts = async () => {
      const currentRegionDetails = US_REGIONS[selectedRegionKey];
      let apiUrl = 'https://api.weather.gov/alerts/active';

      // If a specific region is selected (not 'ALL') and it has areaCodes, append them to the API URL
      if (selectedRegionKey !== 'ALL' && currentRegionDetails && currentRegionDetails.areaCodes && currentRegionDetails.areaCodes.length > 0) {
        apiUrl += `?area=${currentRegionDetails.areaCodes.join(',')}`;
      }
      // For 'ALL', no area parameter is added, so it fetches all active alerts nationally.

      try {
        setLoading(true);
        setError(null); // Clear previous errors
        const response = await axios.get(apiUrl, {
          headers: {
            'Accept': 'application/geo+json'
          }
        });
        setActiveAlerts(response.data.features || []);
      } catch (err) {
        console.error(`Error fetching active alerts for ${selectedRegionKey}:`, err);
        setError(`Failed to fetch weather alerts for ${currentRegionDetails ? currentRegionDetails.name : 'the selected area'}. Please try again later.`);
        setActiveAlerts([]); // Clear alerts on error
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    setSelectedEventType('ALL'); // Reset filter when region changes
  }, [selectedRegionKey]); // Re-run effect when selectedRegionKey changes

  const handleRegionChange = (regionKey) => {
    setSelectedRegionKey(regionKey);
  };

  const handleEventTypeChange = (eventType) => {
    setSelectedEventType(eventType);
  };

  const currentRegion = US_REGIONS[selectedRegionKey];

  // Get unique event types for the filter dropdown
  const eventTypesForFilter = ['ALL', ...new Set(activeAlerts.map(alert => alert.properties?.event).filter(Boolean))];

  // Filter alerts based on selectedEventType
  const filteredAlerts = selectedEventType === 'ALL'
    ? activeAlerts
    : activeAlerts.filter(alert => alert.properties?.event === selectedEventType);

  // Determine if the sidebar should be wide
  const sidebarClassName = selectedRegionKey === 'ALL' ? 'App-sidebar sidebar-wide' : 'App-sidebar';

  return (
    <div className="App">
      <header className="App-header">
        <h1>WeatherAdNerd</h1>
        <div className="App-header-settings">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28px" height="28px" aria-hidden="true" focusable="false">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.25 C14.34,2.01,14.12,1.85,13.87,1.85h-3.74c-0.25,0-0.47,0.16-0.53,0.4L9.2,4.71C8.61,4.95,8.08,5.27,7.58,5.65L5.19,4.69 C4.97,4.62,4.72,4.69,4.6,4.91L2.68,8.23c-0.11,0.2-0.06,0.47,0.12,0.61l2.03,1.58C4.77,10.71,4.75,11.02,4.75,11.34 c0,0.32,0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22 l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.45C9.66,21.99,9.88,22.15,10.13,22.15h3.74c0.25,0,0.47-0.16,0.53-0.4 l0.36-2.45c0.59-0.24,1.12-0.56,1.62-0.94l2.39,0.96c0.22,0.07,0.47,0,0.59-0.22l1.92-3.32 C21.94,13.35,21.89,13.08,21.71,12.94z M12,15.6c-1.98,0-3.6-1.61-3.6-3.6s1.61-3.6,3.6-3.6s3.6,1.61,3.6,3.6 S13.98,15.6,12,15.6z"/>
          </svg>
        </div>
      </header>
      <main>
        <div className="map-area">
          <WeatherMap selectedRegion={selectedRegionKey} />
        </div>
        <div className={sidebarClassName}> 
          <div className="sidebar-controls-row"> 
            <RegionSelector 
              selectedRegion={selectedRegionKey}
              onRegionChange={handleRegionChange} 
            />
            {eventTypesForFilter && eventTypesForFilter.length > 1 && (
              <div className="storm-filter-container"> 
                <label htmlFor="event-type-filter" className="storm-filter-label">Filter by Event:</label>
                <select 
                  id="event-type-filter" 
                  className="storm-filter-select"
                  value={selectedEventType}
                  onChange={(e) => handleEventTypeChange(e.target.value)}
                >
                  {eventTypesForFilter.map(type => (
                    <option key={type} value={type}>
                      {type === 'ALL' ? 'All Events' : type}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading && <p>Loading alerts for {currentRegion?.name || 'selected area'}...</p>}
          {error && <p style={{color: 'red'}}>{error}</p>}
          {!loading && !error && 
            <StormTable 
              alerts={filteredAlerts} 
              selectedRegion={currentRegion} 
              selectedEventType={selectedEventType} 
            />
          }
        </div>
      </main>
    </div>
  );
}

export default App;

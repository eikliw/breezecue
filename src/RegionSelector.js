import React from 'react';
import { REGION_OPTIONS } from './regions'; // Import our defined regions

function RegionSelector({ selectedRegion, onRegionChange }) {
  return (
    <div className="region-selector-container">
      <label htmlFor="region-select" className="region-selector-label">Select Region:</label>
      <select 
        id="region-select" 
        className="region-selector-select"
        value={selectedRegion}
        onChange={(e) => onRegionChange(e.target.value)}
      >
        {REGION_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default RegionSelector;

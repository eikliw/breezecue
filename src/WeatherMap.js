import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, WMSTileLayer, LayersControl, ScaleControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import { US_REGIONS } from './regions'; 

// Helper component to change the map view imperatively
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (map) { // Ensure map instance exists
      if (center && zoom) {
        map.setView(center, zoom);
      }
      // Give the browser a moment for layout to settle, then invalidate size
      // This is a common trick for Leaflet in dynamic layouts.
      setTimeout(() => {
        map.invalidateSize();
      }, 100); // Adjust timeout if needed, or use a more sophisticated resize listener
    }
  }, [center, zoom, map]); // Depend on center, zoom, and map instance
  return null; // This component does not render anything itself
}

function WeatherMap({ selectedRegion }) { 
  // Use US_REGIONS; default to US_REGIONS.ALL if selectedRegion is invalid or not found
  const regionDetails = US_REGIONS[selectedRegion] || US_REGIONS.ALL;

  // NCEP WMS Radar settings
  const radarWMSUrl = "/geoserver/conus/conus_bref_qcd/ows"; // Using /ows as per last successful finding for NCEP
  const radarLayerName = "conus_bref_qcd";

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer 
        // key={selectedRegion} // Key can be removed as ChangeMapView handles updates
        center={US_REGIONS.ALL.coords} // Initial center, e.g., CONUS wide view
        zoom={US_REGIONS.ALL.zoom}   // Initial zoom
        scrollWheelZoom={true} 
      >
        <ChangeMapView center={regionDetails.coords} zoom={regionDetails.zoom} />
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="NCEP Radar">
            <WMSTileLayer
              url={radarWMSUrl}
              layers={radarLayerName}
              format="image/png"
              transparent={true}
              opacity={0.6} 
              attribution="NOAA/NWS Radar Data"
            />
          </LayersControl.Overlay>

        </LayersControl>
        <ScaleControl position="bottomleft" />
        {/* Consider making this Marker dynamic or removing if not central to functionality */}
        <Marker position={US_REGIONS.ALL.coords}> 
          <Popup>
            USA Center (approx.)
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default WeatherMap;

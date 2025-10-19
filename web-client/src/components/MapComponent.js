import React from 'react';
import './MapComponent.css';

const MapComponent = ({ locations = [] }) => {
  const defaultCenter = {
    lat: 12.9716,
    lng: 77.7500
  };

  const generateMapUrl = () => {
    if (locations.length === 0) {
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dgsWUxO4kI5g&q=${defaultCenter.lat},${defaultCenter.lng}&zoom=15`;
    }

    // For multiple locations, center on the first one
    const firstLocation = locations[0];
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dgsWUxO4kI5g&q=${firstLocation.lat},${firstLocation.lng}&zoom=15`;
  };

  const openInGoogleMaps = (location) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="map-container">
      <div className="map-header">
        <h3>📍 Location Map</h3>
        <p>Click on metro stations to view directions</p>
      </div>
      
      <div className="map-wrapper">
        <iframe
          src={generateMapUrl()}
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Location Map"
        ></iframe>
      </div>

      {locations.length > 0 && (
        <div className="map-locations">
          <h4>Nearby Metro Stations</h4>
          <div className="locations-list">
            {locations.map((location, index) => (
              <div 
                key={index} 
                className="location-item"
                onClick={() => openInGoogleMaps(location)}
              >
                <div className="location-icon">🚇</div>
                <div className="location-details">
                  <div className="location-name">{location.name}</div>
                  <div className="location-distance">{location.distance}</div>
                </div>
                <div className="location-action">
                  <span className="action-text">View Directions</span>
                  <span className="action-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;

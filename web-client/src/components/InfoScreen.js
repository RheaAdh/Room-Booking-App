import React from 'react';
import './InfoScreen.css';

const InfoScreen = () => {
  const openMapLocation = (locationName) => {
    // Coordinates for the locations
    const locations = {
      'Professionals Pride PG': {
        lat: 12.9785908,
        lng: 77.7412655,
        address: 'Professionals Pride PG, Whitefield, Bangalore'
      },
      'Kadugodi Tree Park Metro Station': {
        lat: 12.9852582,
        lng: 77.7467606,
        address: 'Kadugodi Tree Park Metro Station, Whitefield, Bangalore'
      },
      'Pattandur Agrahara Metro Station': {
        lat: 12.987622,
        lng: 77.737737,
        address: 'Pattandur Agrahara Metro Station, Whitefield, Bangalore'
      },
      'Kadugodi Tree Park': {
        lat: 12.9865938,
        lng: 77.744809,
        address: 'Kadugodi Tree Park, Whitefield, Bangalore'
      },
      'Vydehi Hospital': {
        lat: 12.9757752,
        lng: 77.7294426,
        address: 'Vydehi Hospital, Whitefield, Bangalore'
      },
      'Sri Sathya Sai Hospital': {
        lat: 12.9827616,
        lng: 77.7295026,
        address: 'Sri Sathya Sai Super Speciality Hospital, Whitefield, Bangalore'
      },
      'ITPL Back Gate': {
        lat: 12.9848843,
        lng: 77.7337851,
        address: 'ITPL Back Gate, Pattandur Agrahara, Whitefield, Bangalore'
      },
      'Nexus Shantiniketan': {
        lat: 12.989536,
        lng: 77.7281015,
        address: 'Nexus Shantiniketan, Whitefield, Bangalore'
      },
      'Manipal Hospital': {
        lat: 12.9880554,
        lng: 77.7287744,
        address: 'Manipal Hospital Whitefield, Bangalore'
      },
      'Whitefield Railway Station': {
        lat: 12.9967809,
        lng: 77.7614399,
        address: 'Whitefield Railway Station, Bangalore'
      },
      'Kempegowda International Airport': {
        lat: 13.198909,
        lng: 77.7068926,
        address: 'Kempegowda International Airport, Bangalore'
      }
    };

    const location = locations[locationName];
    if (location) {
      // Open Google Maps with the location
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
      window.open(mapsUrl, '_blank');
    }
  };


  return (
    <div className="info-screen">
      <div className="info-container">
 {/* Facilities */}
        <div className="info-section">
          <h2>🏆 Facilities & Amenities</h2>
          <div className="facilities-grid">
            <div className="facility-item">
              <span className="facility-icon">📶</span>
              <span className="facility-name">Free WiFi</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">👕</span>
              <span className="facility-name">Washing Machine</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🚗</span>
              <span className="facility-name">Private Parking (₹50/day)</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🍳</span>
              <span className="facility-name">Shared Kitchen</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🌿</span>
              <span className="facility-name">Terrace</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🛏️</span>
              <span className="facility-name">Linen Included</span>
            </div>
          </div>
        </div>

        {/* Check-in/Check-out Info */}
        <div className="info-section checkin-section">
          <h2>🕐 Check-in & Check-out</h2>
          
          {/* Main Check-in/Check-out Cards */}
          <div className="checkin-container">
            <div className="checkin-card checkin-card-primary">
              <div className="checkin-header">
                <div className="checkin-icon">🏨</div>
                <div className="checkin-title">
                  <h3>Check-in</h3>
                  <span className="checkin-subtitle">Arrival Process</span>
                </div>
              </div>
              <div className="checkin-details">
                <div className="time-display">
                  <div className="time-main">
                    <span className="time-start">10:00 AM</span>
                    <span className="time-separator">to</span>
                    <span className="time-end">11:30 PM</span>
                  </div>
                  <div className="time-note">Standard check-in hours</div>
                </div>
                <div className="checkin-features">
                  <div className="feature-item">
                    <span className="feature-icon">⚡</span>
                    <span>Early check-in available (8:00 AM - 10:00 AM)</span>
                  </div>
                  <div className="feature-item">
                  <span className="feature-icon">💰</span>
                    <span>Extra charges for early check-in</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📞</span>
                    <span>Advance notice required for early check-in</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="checkin-card checkin-card-secondary">
              <div className="checkin-header">
                <div className="checkin-icon">🚪</div>
                <div className="checkin-title">
                  <h3>Check-out</h3>
                  <span className="checkin-subtitle">Departure Process</span>
                </div>
              </div>
              <div className="checkin-details">
                <div className="time-display">
                  <div className="time-main">
                    <span className="time-start">1:00 AM</span>
                    <span className="time-separator">to</span>
                    <span className="time-end">10:00 AM</span>
                  </div>
                  <div className="time-note">Standard check-out hours</div>
                </div>
                <div className="checkin-features">
                  <div className="feature-item">
                    <span className="feature-icon">⏰</span>
                    <span>Late check-out available (10:00 AM - 12:00 PM)</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">💰</span>
                    <span>Extra charges apply for late check-out</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📋</span>
                    <span>Room inspection before departure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements and Process */}
          <div className="checkin-process">
            <div className="process-section">
              <h4>📋 Check-in Requirements</h4>
              <div className="requirements-grid">
                <div className="requirement-card">
                  <div className="req-icon">🆔</div>
                  <div className="req-content">
                    <h5>Valid Photo ID</h5>
                    <p>Government-issued ID (Aadhaar, Passport, Driving License)</p>
                  </div>
                </div>
                <div className="requirement-card">
                  <div className="req-icon">💰</div>
                  <div className="req-content">
                    <h5>Payment Confirmation</h5>
                    <p>Booking confirmation or payment receipt</p>
                  </div>
                </div>
                <div className="requirement-card">
                  <div className="req-icon">📱</div>
                  <div className="req-content">
                    <h5>Contact Verification</h5>
                    <p>Active phone number for communication</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="process-section">
              <h4>⚠️ Important Notes</h4>
              <div className="notes-grid">
               
                <div className="note-item info">
                  <span className="note-icon">ℹ️</span>
                  <span>Security deposit may be required for certain bookings</span>
                </div>
                <div className="note-item success">
                  <span className="note-icon">✅</span>
                  <span>24/7 reception support available for assistance</span>
                </div>
                <div className="note-item info">
                  <span className="note-icon">📞</span>
                  <span>Contact us 24 hours before arrival for special requests</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Nearby */}
        <div className="info-section">
          <h2>Location & Nearby</h2>
          
          <div className="location-main">
            <div className="location-content">
              
              <div className="location-map-section">
                <div className="map-container">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.123456789!2d77.7412655!3d12.9785908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae11fe94840e65%3A0x5bcd620973f8a7cd!2sProfessionals%20pride%20%7C%20Hourly!5e0!3m2!1sen!2sin!4v1234567890!5m2!1sen!2sin"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Professionals Pride Location"
                  ></iframe>
                  <div className="map-overlay">
                    <div className="map-info">
                      <span className="map-title">📍 Professionals Pride </span>
                      <span className="map-subtitle">Whitefield, Bangalore</span>
                    </div>
                  </div>
                </div>
              </div>

            
            </div>
          </div>

          <div className="nearby-places">
       
            <div className="nearby-grid">
              <div className="nearby-item metro-station" onClick={() => openMapLocation('Kadugodi Tree Park Metro Station')}>
                <div className="place-info">
                  <span className="place-icon">🚇</span>
                  <span className="place-name">Kadugodi Tree Park Metro Station</span>
                </div>
                <div className="place-details">
                  <span className="place-distance">1.3km</span>
                  <span className="map-link">📍 View Map</span>
                </div>
              </div>
              <div className="nearby-item metro-station" onClick={() => openMapLocation('Pattandur Agrahara Metro Station')}>
                <div className="place-info">
                  <span className="place-icon">🚇</span>
                  <span className="place-name">Pattandur Agrahara Metro Station</span>
                </div>
                <div className="place-details">
                  <span className="place-distance">1.7km</span>
                  <span className="map-link">📍 View Map</span>
                </div>
              </div>
              <div className="nearby-item metro-station" onClick={() => openMapLocation('Kadugodi Tree Park')}>
                <div className="place-info">
                  <span className="place-icon">🌳</span>
                  <span className="place-name">Kadugodi Tree Park</span>
                </div>
                <div className="place-details">
                  <span className="place-distance">1.6km</span>
                  <span className="map-link">📍 View Map</span>
                </div>
              </div>
              <div className="nearby-item metro-station" onClick={() => openMapLocation('Vydehi Hospital')}>
                <div className="place-info">
                  <span className="place-icon">🏥</span>
                  <span className="place-name">Vydehi Hospital</span>
                </div>
                <div className="place-details">
                  <span className="place-distance">3.2km</span>
                  <span className="map-link">📍 View Map</span>
                </div>
              </div>
              <div className="nearby-item metro-station" onClick={() => openMapLocation('Sri Sathya Sai Hospital')}>
                <div className="place-info">
                  <span className="place-icon">🏥</span>
                  <span className="place-name">Sri Sathya Sai Hospital</span>
                </div>
                <div className="place-details">
                  <span className="place-distance">2.5km</span>
                  <span className="map-link">📍 View Map</span>
                </div>
              </div>
              <div className="nearby-item metro-station" onClick={() => openMapLocation('ITPL Back Gate')}>
                <div className="place-info">
                  <span className="place-icon">🏢</span>
                  <span className="place-name">ITPL Back Gate</span>
                </div>
                <div className="place-details">
                  <span className="place-distance">1.5km</span>
                  <span className="map-link">📍 View Map</span>
                </div>
              </div>
              <div className="nearby-item metro-station" onClick={() => openMapLocation('Nexus Shantiniketan')}>
                <div className="place-info">
                  <span className="place-icon">🛍️</span>
                  <span className="place-name">Nexus Shantiniketan</span>
                </div>
                <div className="place-details">
                  <span className="place-distance">2.8km</span>
                  <span className="map-link">📍 View Map</span>
                </div>
              </div>
              <div className="nearby-item metro-station" onClick={() => openMapLocation('Manipal Hospital')}>
                <div className="place-info">
                  <span className="place-icon">🏥</span>
                  <span className="place-name">Manipal Hospital</span>
                </div>
                <div className="place-details">
                  <span className="place-distance">3.3km</span>
                  <span className="map-link">📍 View Map</span>
                </div>
              </div>
              <div className="nearby-item metro-station" onClick={() => openMapLocation('Whitefield Railway Station')}>
                <div className="place-info">
                  <span className="place-icon">🚂</span>
                  <span className="place-name">Whitefield Railway Station</span>
                </div>
                <div className="place-details">
                  <span className="place-distance">4.7km</span>
                  <span className="map-link">📍 View Map</span>
                </div>
              </div>
              <div className="nearby-item metro-station" onClick={() => openMapLocation('Kempegowda International Airport')}>
                <div className="place-info">
                  <span className="place-icon">✈️</span>
                  <span className="place-name">Kempegowda International Airport</span>
                </div>
                <div className="place-details">
                  <span className="place-distance">38km</span>
                  <span className="map-link">📍 View Map</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* House Rules */}
        <div className="info-section">
          <h2>House Rules & Policies</h2>
          <div className="house-rules">
            <div className="rules-grid">
              <div className="rule-category">
                <h3>🚫 Restrictions</h3>
                <ul>
                  <li>No pets allowed</li>
                  <li>No parties/events allowed</li>
                  <li>Quiet hours: 21:00 - 06:00</li>
                  <li>No smoking in rooms</li>
                </ul>
              </div>
              <div className="rule-category">
                <h3>📋 Requirements</h3>
                <ul>
                  <li>Photo ID required at check-in</li>
                  <li>Payment before arrival for confirmation</li>
                  <li>Balance payment on arrival</li>

                </ul>
              </div>
              <div className="rule-category">
                <h3>💰 Extra Charges</h3>
                <ul>
                  <li>Extra bed (6+ years): ₹200/night</li>
                  <li>Luggage storage: Additional charge</li>
                  <li>Private parking: ₹50/day</li>
                  <li>All charges subject to availability</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoScreen;

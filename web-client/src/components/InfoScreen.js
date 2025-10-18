import React from 'react';
import './InfoScreen.css';

const InfoScreen = () => {
  return (
    <div className="info-screen">
      <div className="info-container">
        {/* Hero Section */}
        <div className="info-hero">
          <div className="hero-content">
            <h1>🏨 Professionals Pride PG</h1>
            <p className="hero-subtitle">Your comfortable stay awaits in the heart of Whitefield</p>
            <div className="hero-rating">
              <span className="stars">★★★★★</span>
              <span className="rating-text">4.5/5 • Excellent location</span>
            </div>
          </div>
        </div>


        {/* Facilities */}
        <div className="info-section">
          <h2>🏆 Facilities & Amenities</h2>
          <div className="facilities-grid">
            <div className="facility-item">
              <span className="facility-icon">📶</span>
              <span className="facility-name">Free WiFi (12 Mbps)</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">👨‍👩‍👧‍👦</span>
              <span className="facility-name">Family Rooms</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🚗</span>
              <span className="facility-name">Private Parking (₹50/day)</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🚭</span>
              <span className="facility-name">Non-smoking Rooms</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🕐</span>
              <span className="facility-name">24-hour Front Desk</span>
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
              <span className="facility-icon">🔐</span>
              <span className="facility-name">Lockers</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🛏️</span>
              <span className="facility-name">Linen Included</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🚪</span>
              <span className="facility-name">Private Entrance</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🔌</span>
              <span className="facility-name">Socket Near Bed</span>
            </div>
            <div className="facility-item">
              <span className="facility-icon">🔇</span>
              <span className="facility-name">Soundproofing</span>
            </div>
          </div>
        </div>

        {/* Check-in/Check-out Info */}
        <div className="info-section checkin-section">
          <h2>🕐 Check-in & Check-out</h2>
          <div className="checkin-container">
            <div className="checkin-card">
              <div className="checkin-icon">🏨</div>
              <div className="checkin-details">
                <h3>Check-in</h3>
                <div className="time-display">
                  <span className="time-main">10:00 AM</span>
                  <span className="time-range">to 11:30 PM</span>
                </div>
                <p className="checkin-note">Early check-in available upon request</p>
              </div>
            </div>
            
            <div className="checkin-card">
              <div className="checkin-icon">🚪</div>
              <div className="checkin-details">
                <h3>Check-out</h3>
                <div className="time-display">
                  <span className="time-main">1:00 AM</span>
                  <span className="time-range">to 10:00 AM</span>
                </div>
                <p className="checkin-note">Late check-out available with extra charges</p>
              </div>
            </div>
          </div>
          
          <div className="checkin-requirements">
            <h4>📋 Check-in Requirements</h4>
            <div className="requirements-list">
              <div className="requirement-item">
                <span className="req-icon">🆔</span>
                <span>Valid Photo ID</span>
              </div>
              <div className="requirement-item">
                <span className="req-icon">💰</span>
                <span>Payment confirmation</span>
              </div>
              <div className="requirement-item">
                <span className="req-icon">📱</span>
                <span>Contact number verification</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Nearby */}
        <div className="info-section">
          <h2>Location & Nearby</h2>
          <div className="location-info">
            <div className="location-main">
              <h3>📍 Our Address</h3>
              <p>Professionals Pride PG<br />
              Whitefield, Bangalore, Karnataka<br />
              India</p>
            </div>
            <div className="nearby-places">
              <h3>🏪 What's Nearby</h3>
              <div className="nearby-grid">
                <div className="nearby-item">
                  <span className="place-name">Reserved Forest Mixed Plantation</span>
                  <span className="place-distance">500m</span>
                </div>
                <div className="nearby-item">
                  <span className="place-name">Children Play Park</span>
                  <span className="place-distance">1.1km</span>
                </div>
                <div className="nearby-item">
                  <span className="place-name">Whitefield Railway Station</span>
                  <span className="place-distance">4.1km</span>
                </div>
                <div className="nearby-item">
                  <span className="place-name">Kempegowda International Airport</span>
                  <span className="place-distance">38km</span>
                </div>
                <div className="nearby-item">
                  <span className="place-name">IT Parks & Offices</span>
                  <span className="place-distance">2-5km</span>
                </div>
                <div className="nearby-item">
                  <span className="place-name">Shopping Centers</span>
                  <span className="place-distance">1-3km</span>
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
                <h3>👶 Children Policy</h3>
                <ul>
                  <li>Children 6+ years are welcome</li>
                  <li>Children 18+ years charged as adults</li>
                  <li>Extra bed available: ₹200 per person/night</li>
                </ul>
              </div>
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
                  <li>Payment before arrival via bank transfer</li>
                  <li>Age restriction: 18-50 years</li>
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

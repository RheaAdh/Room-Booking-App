import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './RoomScreen.css';

const RoomScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: 'SINGLE',
    bathroomType: 'ATTACHED',
    dailyReferenceCost: '',
    monthlyReferenceCost: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const roomsRes = await api.get('/rooms');
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleEditRoom = (room) => {
    setFormData({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      bathroomType: room.bathroomType,
      dailyReferenceCost: room.dailyReferenceCost || '',
      monthlyReferenceCost: room.monthlyReferenceCost || ''
    });
    setSelectedRoom(room);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const roomData = {
        roomNumber: formData.roomNumber,
        roomType: formData.roomType,
        bathroomType: formData.bathroomType,
        dailyReferenceCost: formData.dailyReferenceCost ? parseFloat(formData.dailyReferenceCost) : null,
        monthlyReferenceCost: formData.monthlyReferenceCost ? parseFloat(formData.monthlyReferenceCost) : null
      };

      if (isEditing && selectedRoom) {
        await api.put(`/rooms/${selectedRoom.id}`, roomData);
        alert('Room updated successfully!');
      } else {
        await api.post('/rooms', roomData);
        alert('Room created successfully!');
      }

      setShowModal(false);
      setIsEditing(false);
      setSelectedRoom(null);
      setFormData({ roomNumber: '', roomType: 'SINGLE', bathroomType: 'ATTACHED', dailyReferenceCost: '', monthlyReferenceCost: '' });
      fetchData(); // Refresh rooms
    } catch (error) {
      console.error('Error creating/updating room:', error);
      alert('Error creating/updating room. Please try again.');
    }
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await api.delete(`/rooms/${roomId}`);
        fetchData();
        alert('Room deleted successfully!');
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('Error deleting room. Please try again.');
      }
    }
  };


  const getRoomCost = (room) => {
    const costs = [];
    if (room.dailyReferenceCost) {
      costs.push(`Daily: ₹${room.dailyReferenceCost}`);
    }
    if (room.monthlyReferenceCost) {
      costs.push(`Monthly: ₹${room.monthlyReferenceCost}`);
    }
    return costs.length > 0 ? costs.join(' | ') : 'No cost set';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="room-screen">
          <div className="page-header">
            <h1>Room Management</h1>
            <div className="header-actions">
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                + Add Room
              </button>
            </div>
          </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Rooms</h3>
          <p className="text-muted" style={{ fontSize: '14px', margin: '5px 0 0 0' }}>
            Room information and pricing management
          </p>
        </div>
        <div className="card-body">
          {rooms.length === 0 ? (
            <div className="empty-state">
              <p>No rooms found. Add your first room!</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map(room => (
                <div key={room.id} className="room-card">
                  <div className="room-header">
                    <h4>Room {room.roomNumber}</h4>
                    <div className="room-actions">
                      <button 
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEditRoom(room)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(room.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="room-details">
                    <p><strong>Type:</strong> {room.roomType}</p>
                    <p><strong>Bathroom:</strong> {room.bathroomType}</p>
                    <p><strong>Cost:</strong> {getRoomCost(room)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Add Room Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Room' : 'Add New Room'}</h3>
              <button className="modal-close" onClick={() => {
                setShowModal(false);
                setIsEditing(false);
                setSelectedRoom(null);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select
                  className="form-control"
                  value={formData.roomType}
                  onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                >
                  <option value="SINGLE">Single</option>
                  <option value="DOUBLE">Double</option>
                  <option value="TRIPLE">Triple</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
                  <div className="form-group">
                    <label className="form-label">Bathroom Type</label>
                    <select
                      className="form-control"
                      value={formData.bathroomType}
                      onChange={(e) => setFormData({...formData, bathroomType: e.target.value})}
                    >
                      <option value="ATTACHED">Attached</option>
                      <option value="COMMON">Common</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Daily Reference Cost (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.dailyReferenceCost}
                      onChange={(e) => setFormData({...formData, dailyReferenceCost: e.target.value})}
                      min="0"
                      step="0.01"
                      placeholder="Enter daily cost"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Reference Cost (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.monthlyReferenceCost}
                      onChange={(e) => setFormData({...formData, monthlyReferenceCost: e.target.value})}
                      min="0"
                      step="0.01"
                      placeholder="Enter monthly cost"
                    />
                  </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                  setSelectedRoom(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoomScreen;

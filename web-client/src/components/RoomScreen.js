import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './RoomScreen.css';

const RoomScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [roomConfigurations, setRoomConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    bathroomType: 'ATTACHED',
    description: ''
  });
  const [configFormData, setConfigFormData] = useState({
    personCount: 1,
    dailyCost: '',
    monthlyCost: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsRes, configsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/room-configurations')
      ]);
      setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);
      setRoomConfigurations(Array.isArray(configsRes.data) ? configsRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setRooms([]);
      setRoomConfigurations([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoomConfigurations = (roomId) => {
    return roomConfigurations.filter(config => config.roomId === roomId);
  };


  const handleEditRoom = (room) => {
    setRoomFormData({
      roomNumber: room.roomNumber,
      bathroomType: room.bathroomType,
      description: room.description || ''
    });
    setSelectedRoom(room);
    setIsEditingRoom(true);
    setShowRoomModal(true);
  };

  const handleAddConfig = (room) => {
    setSelectedRoom(room);
    setConfigFormData({
      personCount: 1,
      dailyCost: '',
      monthlyCost: '',
      description: ''
    });
    setIsEditingConfig(false);
    setShowConfigModal(true);
  };

  const handleEditConfig = (config) => {
    setConfigFormData({
      personCount: config.personCount,
      dailyCost: config.dailyCost || '',
      monthlyCost: config.monthlyCost || '',
      description: config.description || ''
    });
    setSelectedConfig(config);
    setIsEditingConfig(true);
    setShowConfigModal(true);
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      const roomData = {
        roomNumber: roomFormData.roomNumber,
        bathroomType: roomFormData.bathroomType,
        description: roomFormData.description
      };

      if (isEditingRoom && selectedRoom) {
        await api.put(`/rooms/${selectedRoom.id}`, roomData);
        alert('Room updated successfully!');
      } else {
        await api.post('/rooms', roomData);
        alert('Room created successfully!');
      }

      setShowRoomModal(false);
      setIsEditingRoom(false);
      setSelectedRoom(null);
      setRoomFormData({ roomNumber: '', bathroomType: 'ATTACHED', description: '' });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error creating/updating room:', error);
      alert('Error creating/updating room. Please try again.');
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      const configData = {
        roomId: selectedRoom.id,
        personCount: parseInt(configFormData.personCount),
        dailyCost: parseFloat(configFormData.dailyCost),
        monthlyCost: parseFloat(configFormData.monthlyCost),
        description: configFormData.description
      };

      if (isEditingConfig && selectedConfig) {
        await api.put(`/room-configurations/${selectedConfig.id}`, configData);
        alert('Room configuration updated successfully!');
      } else {
        await api.post('/room-configurations', configData);
        alert('Room configuration created successfully!');
      }

      setShowConfigModal(false);
      setIsEditingConfig(false);
      setSelectedConfig(null);
      setConfigFormData({ personCount: 1, dailyCost: '', monthlyCost: '', description: '' });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error creating/updating room configuration:', error);
      alert('Error creating/updating room configuration. Please try again.');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room? This will also delete all room configurations.')) {
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

  const handleDeleteConfig = async (configId) => {
    if (window.confirm('Are you sure you want to delete this room configuration?')) {
      try {
        await api.delete(`/room-configurations/${configId}`);
        fetchData();
        alert('Room configuration deleted successfully!');
      } catch (error) {
        console.error('Error deleting room configuration:', error);
        alert('Error deleting room configuration. Please try again.');
      }
    }
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
          <button className="btn btn-primary" onClick={() => {
            setRoomFormData({ roomNumber: '', bathroomType: 'ATTACHED', description: '' });
            setIsEditingRoom(false);
            setShowRoomModal(true);
          }}>
            + Add Room
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Rooms</h3>
          <p className="text-muted" style={{ fontSize: '14px', margin: '5px 0 0 0' }}>
            Room information and configuration management
          </p>
        </div>
        <div className="card-body">
          {(!rooms || rooms.length === 0) ? (
            <div className="empty-state">
              <p>No rooms found. Add your first room!</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {(rooms || []).map(room => {
                const configs = getRoomConfigurations(room.id);
                return (
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
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="room-details">
                      <p><strong>Bathroom:</strong> {room.bathroomType}</p>
                      {room.description && <p><strong>Description:</strong> {room.description}</p>}
                      <div className="configurations">
                        <h5>Configurations ({configs.length}):</h5>
                        {configs.length === 0 ? (
                          <div>
                            <p className="text-muted">No configurations added yet</p>
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => handleAddConfig(room)}
                              style={{ fontSize: '12px' }}
                            >
                              + Add Configuration
                            </button>
                          </div>
                        ) : (
                          <div className="config-list">
                            {configs.map(config => (
                              <div key={config.id} className="config-item">
                                <span className="config-info">
                                  {config.personCount} person(s) - 
                                  Daily: ₹{config.dailyCost} | 
                                  Monthly: ₹{config.monthlyCost}
                                </span>
                                <div className="config-actions">
                                  <button 
                                    className="btn btn-xs btn-warning"
                                    onClick={() => handleEditConfig(config)}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    className="btn btn-xs btn-danger"
                                    onClick={() => handleDeleteConfig(config.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="config-add-section" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleAddConfig(room)}
                            style={{ fontSize: '12px' }}
                          >
                            + Add Configuration
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>


      {/* Room Modal */}
      {showRoomModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditingRoom ? 'Edit Room' : 'Add New Room'}</h3>
              <button className="modal-close" onClick={() => {
                setShowRoomModal(false);
                setIsEditingRoom(false);
                setSelectedRoom(null);
              }}>×</button>
            </div>
            <form onSubmit={handleRoomSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={roomFormData.roomNumber}
                  onChange={(e) => setRoomFormData({...roomFormData, roomNumber: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bathroom Type</label>
                <select
                  className="form-control"
                  value={roomFormData.bathroomType}
                  onChange={(e) => setRoomFormData({...roomFormData, bathroomType: e.target.value})}
                >
                  <option value="ATTACHED">Attached</option>
                  <option value="COMMON">Common</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={roomFormData.description}
                  onChange={(e) => setRoomFormData({...roomFormData, description: e.target.value})}
                  rows="3"
                  placeholder="Room description (optional)"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowRoomModal(false);
                  setIsEditingRoom(false);
                  setSelectedRoom(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Configuration Modal */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{isEditingConfig ? 'Edit Configuration' : 'Add Room Configuration'}</h3>
              <p className="text-muted">Room: {selectedRoom?.roomNumber}</p>
              <button className="modal-close" onClick={() => {
                setShowConfigModal(false);
                setIsEditingConfig(false);
                setSelectedConfig(null);
              }}>×</button>
            </div>
            <form onSubmit={handleConfigSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Number of People</label>
                <select
                  className="form-control"
                  value={configFormData.personCount}
                  onChange={(e) => setConfigFormData({...configFormData, personCount: parseInt(e.target.value)})}
                  required
                >
                  <option value={1}>1 Person</option>
                  <option value={2}>2 People</option>
                  <option value={3}>3 People</option>
                  <option value={4}>4 People</option>
                  <option value={5}>5 People</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Daily Cost (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={configFormData.dailyCost}
                  onChange={(e) => setConfigFormData({...configFormData, dailyCost: e.target.value})}
                  min="0"
                  step="0.01"
                  placeholder="Enter daily cost"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Cost (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={configFormData.monthlyCost}
                  onChange={(e) => setConfigFormData({...configFormData, monthlyCost: e.target.value})}
                  min="0"
                  step="0.01"
                  placeholder="Enter monthly cost"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={configFormData.description}
                  onChange={(e) => setConfigFormData({...configFormData, description: e.target.value})}
                  rows="2"
                  placeholder="Configuration description (optional)"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowConfigModal(false);
                  setIsEditingConfig(false);
                  setSelectedConfig(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditingConfig ? 'Update Configuration' : 'Add Configuration'}
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

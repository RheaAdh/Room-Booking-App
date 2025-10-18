package com.example.profpride.services;

import com.example.profpride.models.RoomConfiguration;
import com.example.profpride.repositories.RoomConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoomConfigurationService {

    @Autowired
    private RoomConfigurationRepository roomConfigurationRepository;

    public List<RoomConfiguration> getAllRoomConfigurations() {
        return roomConfigurationRepository.findAll();
    }

    public List<RoomConfiguration> getConfigurationsByRoomId(Long roomId) {
        return roomConfigurationRepository.findByRoomId(roomId);
    }

    public List<RoomConfiguration> getAvailableConfigurationsByRoomId(Long roomId) {
        return roomConfigurationRepository.findByRoomIdAndIsAvailableTrue(roomId);
    }

    public List<RoomConfiguration> getConfigurationsByPersonCount(Integer personCount) {
        return roomConfigurationRepository.findByPersonCountAndIsAvailableTrue(personCount);
    }

    public Optional<RoomConfiguration> getConfigurationByRoomAndPersonCount(Long roomId, Integer personCount) {
        return Optional.ofNullable(roomConfigurationRepository.findByRoomIdAndPersonCount(roomId, personCount));
    }

    public RoomConfiguration createRoomConfiguration(RoomConfiguration roomConfiguration) {
        return roomConfigurationRepository.save(roomConfiguration);
    }

    public RoomConfiguration updateRoomConfiguration(Long id, RoomConfiguration updatedConfiguration) {
        if (roomConfigurationRepository.existsById(id)) {
            updatedConfiguration.setId(id);
            return roomConfigurationRepository.save(updatedConfiguration);
        } else {
            throw new RuntimeException("Room configuration not found with id: " + id);
        }
    }

    public void deleteRoomConfiguration(Long id) {
        if (roomConfigurationRepository.existsById(id)) {
            roomConfigurationRepository.deleteById(id);
        } else {
            throw new RuntimeException("Room configuration not found with id: " + id);
        }
    }

    public Optional<RoomConfiguration> getRoomConfigurationById(Long id) {
        return roomConfigurationRepository.findById(id);
    }
}

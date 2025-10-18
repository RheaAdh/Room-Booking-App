package com.example.profpride.controllers;

import com.example.profpride.models.RoomConfiguration;
import com.example.profpride.services.RoomConfigurationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/room-configurations")
public class RoomConfigurationController {

    @Autowired
    private RoomConfigurationService roomConfigurationService;

    @GetMapping
    public ResponseEntity<List<RoomConfiguration>> getAllRoomConfigurations() {
        List<RoomConfiguration> configurations = roomConfigurationService.getAllRoomConfigurations();
        return new ResponseEntity<>(configurations, HttpStatus.OK);
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<RoomConfiguration>> getConfigurationsByRoomId(@PathVariable Long roomId) {
        List<RoomConfiguration> configurations = roomConfigurationService.getConfigurationsByRoomId(roomId);
        return new ResponseEntity<>(configurations, HttpStatus.OK);
    }

    @GetMapping("/room/{roomId}/available")
    public ResponseEntity<List<RoomConfiguration>> getAvailableConfigurationsByRoomId(@PathVariable Long roomId) {
        List<RoomConfiguration> configurations = roomConfigurationService.getAvailableConfigurationsByRoomId(roomId);
        return new ResponseEntity<>(configurations, HttpStatus.OK);
    }

    @GetMapping("/person-count/{personCount}")
    public ResponseEntity<List<RoomConfiguration>> getConfigurationsByPersonCount(@PathVariable Integer personCount) {
        List<RoomConfiguration> configurations = roomConfigurationService.getConfigurationsByPersonCount(personCount);
        return new ResponseEntity<>(configurations, HttpStatus.OK);
    }

    @GetMapping("/room/{roomId}/person-count/{personCount}")
    public ResponseEntity<RoomConfiguration> getConfigurationByRoomAndPersonCount(
            @PathVariable Long roomId, 
            @PathVariable Integer personCount) {
        Optional<RoomConfiguration> configuration = roomConfigurationService.getConfigurationByRoomAndPersonCount(roomId, personCount);
        if (configuration.isPresent()) {
            return new ResponseEntity<>(configuration.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping
    public ResponseEntity<?> createRoomConfiguration(@RequestBody RoomConfiguration roomConfiguration) {
        try {
            RoomConfiguration savedConfiguration = roomConfigurationService.createRoomConfiguration(roomConfiguration);
            return new ResponseEntity<>(savedConfiguration, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to create room configuration: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoomConfiguration(@PathVariable Long id, @RequestBody RoomConfiguration updatedConfiguration) {
        try {
            RoomConfiguration savedConfiguration = roomConfigurationService.updateRoomConfiguration(id, updatedConfiguration);
            return new ResponseEntity<>(savedConfiguration, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to update room configuration: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoomConfiguration(@PathVariable Long id) {
        try {
            roomConfigurationService.deleteRoomConfiguration(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomConfiguration> getRoomConfigurationById(@PathVariable Long id) {
        Optional<RoomConfiguration> configuration = roomConfigurationService.getRoomConfigurationById(id);
        if (configuration.isPresent()) {
            return new ResponseEntity<>(configuration.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}

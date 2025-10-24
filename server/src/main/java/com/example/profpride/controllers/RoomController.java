package com.example.profpride.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.profpride.models.Room;
import com.example.profpride.services.RoomService;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @PostMapping
    public ResponseEntity<Room> createRoom(@RequestBody Room room) {
        Room savedRoom = roomService.createRoom(room);
        return new ResponseEntity<>(savedRoom, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {
        List<Room> rooms = roomService.getAllRooms();
        return new ResponseEntity<>(rooms, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable Long id) {
        Optional<Room> room = roomService.getRoomById(id);
        if (room.isPresent()) {
            return new ResponseEntity<>(room.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Room> updateRoom(@PathVariable Long id, @RequestBody Room updatedRoom) {
        try {
            Room savedRoom = roomService.updateRoom(id, updatedRoom);
            return new ResponseEntity<>(savedRoom, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        try {
            roomService.deleteRoom(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/check-availability")
    public ResponseEntity<List<Room>> checkRoomAvailability(
            @RequestParam String checkInDate,
            @RequestParam String checkOutDate) {
        
        try {
            List<Room> availableRooms = roomService.checkRoomAvailability(checkInDate, checkOutDate);
            return new ResponseEntity<>(availableRooms, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/available")
    public ResponseEntity<List<Room>> getAvailableRooms(
            @RequestParam String checkInDate,
            @RequestParam String checkOutDate) {
        
        try {
            List<Room> availableRooms = roomService.checkRoomAvailability(checkInDate, checkOutDate);
            return new ResponseEntity<>(availableRooms, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<?> uploadRoomImages(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) {
        try {
            List<String> imageUrls = roomService.uploadRoomImages(id, files);
            return new ResponseEntity<>(imageUrls, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Failed to upload images: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}/images")
    public ResponseEntity<?> deleteRoomImage(
            @PathVariable Long id,
            @RequestParam String imageUrl) {
        try {
            roomService.deleteRoomImage(id, imageUrl);
            return ResponseEntity.ok("Image deleted");
        } catch (Exception e) {
            return new ResponseEntity<>("Failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
    
}

package com.example.profpride.services;

import com.example.profpride.models.Room;
import com.example.profpride.models.Booking;
import com.example.profpride.repositories.RoomRepository;
import com.example.profpride.repositories.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;
    
    @Autowired
    private BookingRepository bookingRepository;

    public Room createRoom(Room room) {
        return roomRepository.save(room);
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Optional<Room> getRoomById(Long id) {
        return roomRepository.findById(id);
    }

    public Room updateRoom(Long id, Room updatedRoom) {
        return roomRepository.findById(id).map(room -> {
            room.setRoomNumber(updatedRoom.getRoomNumber());
            room.setRoomType(updatedRoom.getRoomType());
            room.setBathroomType(updatedRoom.getBathroomType());
            room.setDailyReferenceCost(updatedRoom.getDailyReferenceCost());
            room.setMonthlyReferenceCost(updatedRoom.getMonthlyReferenceCost());
            return roomRepository.save(room);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
    }

    public void deleteRoom(Long id) {
        if (roomRepository.existsById(id)) {
            roomRepository.deleteById(id);
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found");
        }
    }

    public List<Room> checkRoomAvailability(String checkInDate, String checkOutDate) {
        try {
            // Parse the dates
            LocalDateTime checkIn = parseDateTime(checkInDate);
            LocalDateTime checkOut = parseDateTime(checkOutDate);
            
            // Get all rooms
            List<Room> allRooms = roomRepository.findAll();
            
            // Filter out rooms that have confirmed bookings for the requested dates
            List<Room> availableRooms = allRooms.stream()
                .filter(room -> {
                    // Get all bookings for this room
                    List<Booking> roomBookings = bookingRepository.findByRoom(room);
                    
                    // Check if any confirmed booking overlaps with the requested dates
                    return roomBookings.stream()
                        .noneMatch(booking -> {
                            // Only check confirmed bookings
                            if (booking.getBookingStatus() == null || 
                                !booking.getBookingStatus().toString().equals("CONFIRMED")) {
                                return false;
                            }
                            
                            // Check for date overlap
                            return (checkIn.isBefore(booking.getCheckOutDate()) &&
                                   checkOut.isAfter(booking.getCheckInDate()));
                        });
                })
                .collect(Collectors.toList());
            
            return availableRooms;
            
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date format: " + e.getMessage());
        }
    }
    
    /**
     * Helper method to parse date strings with or without timezone information
     */
    private LocalDateTime parseDateTime(String dateTimeStr) {
        try {
            if (dateTimeStr.contains("Z") || dateTimeStr.contains("+") || dateTimeStr.contains("-")) {
                return ZonedDateTime.parse(dateTimeStr).toLocalDateTime();
            } else {
                return LocalDateTime.parse(dateTimeStr);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format: " + dateTimeStr + 
                ". Expected ISO format (e.g., 2025-10-15T14:00:00 or 2025-10-15T14:00:00.000Z)");
        }
    }
}

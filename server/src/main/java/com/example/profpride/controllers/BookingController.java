package com.example.profpride.controllers;

import com.example.profpride.models.Booking;
import com.example.profpride.models.Customer;
import com.example.profpride.models.Room;
import com.example.profpride.repositories.BookingRepository;
import com.example.profpride.repositories.CustomerRepository;
import com.example.profpride.repositories.RoomRepository;
import com.example.profpride.repositories.PaymentRepository;
import com.example.profpride.enums.BookingStatus;
import com.example.profpride.enums.BookingDurationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/bookings")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081", "exp://192.168.1.12:8081"})
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        try {
            List<Booking> bookings = bookingRepository.findAll();
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        try {
            Optional<Booking> booking = bookingRepository.findById(id);
            if (booking.isPresent()) {
                return ResponseEntity.ok(booking.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Booking booking) {
        try {
            // Validate customer exists by phone number
            Customer customer = customerRepository.findByPhoneNumber(booking.getCustomerPhoneNumber());
            if (customer == null) {
                return ResponseEntity.badRequest().build();
            }

            // Validate room exists
            Optional<Room> roomOpt = roomRepository.findById(booking.getRoomId());
            if (!roomOpt.isPresent()) {
                return ResponseEntity.badRequest().build();
            }
            
            Room room = roomOpt.get();
            
            // Check room availability for the requested dates
            List<Booking> existingBookings = bookingRepository.findByRoom(room);
            Optional<Booking> conflictingBooking = existingBookings.stream()
                .filter(existingBooking -> {
                    // Only check confirmed and checked-in bookings
                    if (existingBooking.getBookingStatus() == null) {
                        return false;
                    }
                    
                    String status = existingBooking.getBookingStatus().toString();
                    if (!status.equals("PENDING") && !status.equals("CHECKEDIN")) {
                        return false;
                    }
                    
                    // Check for date overlap
                    return (booking.getCheckInDate().isBefore(existingBooking.getCheckOutDate()) &&
                           booking.getCheckOutDate().isAfter(existingBooking.getCheckInDate()));
                })
                .findFirst();
            
            if (conflictingBooking.isPresent()) {
                Booking conflict = conflictingBooking.get();
                String errorMessage = String.format(
                    "Room %s is already booked from %s to %s. Please choose different dates or room.",
                    room.getRoomNumber(),
                    conflict.getCheckInDate().toLocalDate(),
                    conflict.getCheckOutDate().toLocalDate()
                );
                
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .header("X-Error-Message", errorMessage)
                    .body(null);
            }
            
            // Costs should be provided from frontend based on room configuration
            // No need to set default costs from room as they are now managed by room configurations

            // Set default values
            if (booking.getBookingStatus() == null) {
                booking.setBookingStatus(BookingStatus.PENDING);
            }
            if (booking.getCreatedAt() == null) {
                booking.setCreatedAt(LocalDateTime.now());
            }
            if (booking.getUpdatedAt() == null) {
                booking.setUpdatedAt(LocalDateTime.now());
            }

            // Calculate total amount
            calculateTotalAmount(booking);

            Booking savedBooking = bookingRepository.save(booking);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedBooking);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(@PathVariable Long id, @RequestBody Booking updatedBooking) {
        try {
            Optional<Booking> existingBooking = bookingRepository.findById(id);
            if (!existingBooking.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Booking booking = existingBooking.get();
            
            // Check room availability for the updated dates (if dates are being changed)
            if (updatedBooking.getCheckInDate() != null || updatedBooking.getCheckOutDate() != null) {
                LocalDateTime checkInDate = updatedBooking.getCheckInDate() != null ? 
                    updatedBooking.getCheckInDate() : booking.getCheckInDate();
                LocalDateTime checkOutDate = updatedBooking.getCheckOutDate() != null ? 
                    updatedBooking.getCheckOutDate() : booking.getCheckOutDate();
                
                List<Booking> existingBookings = bookingRepository.findByRoom(booking.getRoom());
                Optional<Booking> conflictingBooking = existingBookings.stream()
                    .filter(existingBookingItem -> {
                        // Skip the current booking being updated
                        if (existingBookingItem.getId().equals(booking.getId())) {
                            return false;
                        }
                        
                        // Only check confirmed and checked-in bookings
                        if (existingBookingItem.getBookingStatus() == null) {
                            return false;
                        }
                        
                        String status = existingBookingItem.getBookingStatus().toString();
                        if (!status.equals("CONFIRMED") && !status.equals("CHECKEDIN")) {
                            return false;
                        }
                        
                        // Check for date overlap
                        return (checkInDate.isBefore(existingBookingItem.getCheckOutDate()) &&
                               checkOutDate.isAfter(existingBookingItem.getCheckInDate()));
                    })
                    .findFirst();
                
                if (conflictingBooking.isPresent()) {
                    Booking conflict = conflictingBooking.get();
                    String errorMessage = String.format(
                        "Room %s is already booked from %s to %s. Please choose different dates or room.",
                        booking.getRoom().getRoomNumber(),
                        conflict.getCheckInDate().toLocalDate(),
                        conflict.getCheckOutDate().toLocalDate()
                    );
                    
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                        .header("X-Error-Message", errorMessage)
                        .body(null);
                }
            }
            
            // Update fields
            if (updatedBooking.getRoomId() != null) {
                booking.setRoomId(updatedBooking.getRoomId());
            }
            if (updatedBooking.getCheckInDate() != null) {
                booking.setCheckInDate(updatedBooking.getCheckInDate());
            }
            if (updatedBooking.getCheckOutDate() != null) {
                booking.setCheckOutDate(updatedBooking.getCheckOutDate());
            }
            if (updatedBooking.getBookingStatus() != null) {
                booking.setBookingStatus(updatedBooking.getBookingStatus());
            }
            if (updatedBooking.getDailyCost() != null) {
                booking.setDailyCost(updatedBooking.getDailyCost());
            }
            if (updatedBooking.getMonthlyCost() != null) {
                booking.setMonthlyCost(updatedBooking.getMonthlyCost());
            }
            if (updatedBooking.getEarlyCheckinCost() != null) {
                booking.setEarlyCheckinCost(updatedBooking.getEarlyCheckinCost());
            }
            if (updatedBooking.getLateCheckoutCost() != null) {
                booking.setLateCheckoutCost(updatedBooking.getLateCheckoutCost());
            }
            
            // Recalculate total amount
            calculateTotalAmount(booking);
            if (updatedBooking.getRemarks() != null) {
                booking.setRemarks(updatedBooking.getRemarks());
            }
            if (updatedBooking.getNumberOfPeople() != null) {
                booking.setNumberOfPeople(updatedBooking.getNumberOfPeople());
            }

            booking.setUpdatedAt(LocalDateTime.now());
            Booking savedBooking = bookingRepository.save(booking);
            return ResponseEntity.ok(savedBooking);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        try {
            if (bookingRepository.existsById(id)) {
                bookingRepository.deleteById(id);
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/customer/{phoneNumber}")
    public ResponseEntity<List<Booking>> getBookingsByCustomer(@PathVariable String phoneNumber) {
        try {
            List<Booking> bookings = bookingRepository.findByCustomerPhoneNumber(phoneNumber);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<Booking>> getBookingsByRoom(@PathVariable Long roomId) {
        try {
            Optional<Room> room = roomRepository.findById(roomId);
            if (!room.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            List<Booking> bookings = bookingRepository.findByRoom(room.get());
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Booking>> getBookingsByStatus(@PathVariable String status) {
        try {
            BookingStatus bookingStatus = BookingStatus.valueOf(status.toUpperCase());
            List<Booking> bookings = bookingRepository.findByBookingStatus(bookingStatus);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/checkin")
    public ResponseEntity<Booking> checkIn(@PathVariable Long id) {
        try {
            Optional<Booking> bookingOpt = bookingRepository.findById(id);
            if (bookingOpt.isPresent()) {
                Booking booking = bookingOpt.get();
                if (booking.getBookingStatus() == BookingStatus.PENDING) {
                    booking.setBookingStatus(BookingStatus.CHECKEDIN);
                    // Set actual check-in date to current time
                    booking.setCheckInDate(LocalDateTime.now());
                    booking.setUpdatedAt(LocalDateTime.now());
                    Booking updatedBooking = bookingRepository.save(booking);
                    return ResponseEntity.ok(updatedBooking);
                } else {
                    return ResponseEntity.badRequest().build();
                }
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PatchMapping("/{id}/checkout")
    public ResponseEntity<Booking> checkOut(@PathVariable Long id) {
        try {
            Optional<Booking> bookingOpt = bookingRepository.findById(id);
            if (bookingOpt.isPresent()) {
                Booking booking = bookingOpt.get();
                if (booking.getBookingStatus() == BookingStatus.CHECKEDIN) {
                    booking.setBookingStatus(BookingStatus.CHECKEDOUT);
                    // Set actual check-out date to current time
                    booking.setCheckOutDate(LocalDateTime.now());
                    booking.setUpdatedAt(LocalDateTime.now());
                    Booking updatedBooking = bookingRepository.save(booking);
                    return ResponseEntity.ok(updatedBooking);
                } else {
                    return ResponseEntity.badRequest().build();
                }
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private void calculateTotalAmount(Booking booking) {
        BigDecimal total = BigDecimal.ZERO;
        
        // Calculate duration in days
        long durationInDays = java.time.temporal.ChronoUnit.DAYS.between(
            booking.getCheckInDate().toLocalDate(), 
            booking.getCheckOutDate().toLocalDate()
        );
        
        // Determine pricing based on duration: 30+ days = monthly rate, <30 days = daily rate
        if (durationInDays >= 30) {
            // Use monthly rate for stays of 30+ days
            booking.setBookingDurationType(BookingDurationType.MONTHLY);
            if (booking.getMonthlyCost() != null) {
                total = total.add(booking.getMonthlyCost());
            }
        } else {
            // Use daily rate for stays less than 30 days
            booking.setBookingDurationType(BookingDurationType.DAILY);
            if (booking.getDailyCost() != null) {
                // Calculate total daily cost based on number of days
                BigDecimal dailyCostPerDay = booking.getDailyCost();
                total = total.add(dailyCostPerDay.multiply(BigDecimal.valueOf(durationInDays)));
            }
        }
        
        // Add early check-in cost
        if (booking.getEarlyCheckinCost() != null) {
            total = total.add(booking.getEarlyCheckinCost());
        }
        
        // Add late checkout cost
        if (booking.getLateCheckoutCost() != null) {
            total = total.add(booking.getLateCheckoutCost());
        }
        
        booking.setTotalAmount(total);
    }
}

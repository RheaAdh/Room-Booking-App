package com.example.profpride.controllers;

import com.example.profpride.models.Booking;
import com.example.profpride.models.Customer;
import com.example.profpride.models.Room;
import com.example.profpride.models.Payment;
import com.example.profpride.repositories.BookingRepository;
import com.example.profpride.repositories.CustomerRepository;
import com.example.profpride.repositories.RoomRepository;
import com.example.profpride.repositories.PaymentRepository;
import com.example.profpride.enums.BookingStatus;
import com.example.profpride.enums.PaymentStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            // Validate customer exists
            Optional<Customer> customer = customerRepository.findById(booking.getCustomerPhoneNumber());
            if (!customer.isPresent()) {
                return ResponseEntity.badRequest().build();
            }

            // Validate room exists
            Optional<Room> room = roomRepository.findById(booking.getRoomId());
            if (!room.isPresent()) {
                return ResponseEntity.badRequest().build();
            }

            // Set default values
            if (booking.getBookingStatus() == null) {
                booking.setBookingStatus(BookingStatus.CONFIRMED);
            }
            if (booking.getPaymentStatus() == null) {
                booking.setPaymentStatus(PaymentStatus.PENDING);
            }
            if (booking.getCreatedAt() == null) {
                booking.setCreatedAt(LocalDateTime.now());
            }
            if (booking.getUpdatedAt() == null) {
                booking.setUpdatedAt(LocalDateTime.now());
            }

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
            
            // Update fields
            if (updatedBooking.getCheckInDate() != null) {
                booking.setCheckInDate(updatedBooking.getCheckInDate());
            }
            if (updatedBooking.getCheckOutDate() != null) {
                booking.setCheckOutDate(updatedBooking.getCheckOutDate());
            }
            if (updatedBooking.getBookingStatus() != null) {
                booking.setBookingStatus(updatedBooking.getBookingStatus());
            }
            if (updatedBooking.getPaymentStatus() != null) {
                booking.setPaymentStatus(updatedBooking.getPaymentStatus());
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
            if (updatedBooking.getTotalAmount() != null) {
                booking.setTotalAmount(updatedBooking.getTotalAmount());
            }
            if (updatedBooking.getRemarks() != null) {
                booking.setRemarks(updatedBooking.getRemarks());
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
}

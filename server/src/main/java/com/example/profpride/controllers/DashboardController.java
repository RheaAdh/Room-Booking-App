package com.example.profpride.controllers;

import com.example.profpride.enums.BookingStatus;
import com.example.profpride.models.Booking;
import com.example.profpride.models.Customer;
import com.example.profpride.models.Room;
import com.example.profpride.models.Payment;
import com.example.profpride.repositories.BookingRepository;
import com.example.profpride.repositories.CustomerRepository;
import com.example.profpride.repositories.RoomRepository;
import com.example.profpride.repositories.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @GetMapping("/today-summary")
    public ResponseEntity<Map<String, Object>> getTodaySummary(@RequestParam String date) {
        try {
            LocalDate targetDate = LocalDate.parse(date);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = targetDate.plusDays(1).atStartOfDay();

            // Get total counts
            long totalCustomers = customerRepository.count();
            long totalRooms = roomRepository.count();
            long availableRooms = roomRepository.countByIsAvailableTrue();

            // Get today's bookings
            List<Booking> todayBookings = bookingRepository.findByCheckInDateBetweenOrCheckOutDateBetween(
                startOfDay, endOfDay, startOfDay, endOfDay
            );

            // Get check-ins for today (CONFIRMED bookings that are due for check-in today)
            List<Booking> checkIns = bookingRepository.findByCheckInDateBetweenAndBookingStatus(startOfDay, endOfDay, BookingStatus.PENDING);
            
            // Get check-outs for today (CHECKEDIN bookings that are due for check-out today)
            List<Booking> checkOuts = bookingRepository.findByCheckOutDateBetweenAndBookingStatus(startOfDay, endOfDay, com.example.profpride.enums.BookingStatus.CHECKEDIN);

            // Calculate occupancy rate
            long occupiedRooms = totalRooms - availableRooms;
            double occupancyRate = totalRooms > 0 ? (double) occupiedRooms / totalRooms * 100 : 0;

            // Create detailed booking data for frontend
            List<Map<String, Object>> checkInDetails = checkIns.stream()
                .map(booking -> {
                    // Calculate actual due amount (total - paid)
                    List<Payment> payments = paymentRepository.findByBookingId(booking.getId());
                    double totalPaid = payments.stream()
                        .mapToDouble(payment -> payment.getAmount().doubleValue())
                        .sum();
                    double totalAmount = booking.getTotalAmount() != null ? booking.getTotalAmount().doubleValue() : 0.0;
                    double actualDueAmount = totalAmount - totalPaid;
                    
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("customerName", getCustomerName(booking.getCustomerPhoneNumber()));
                    detail.put("roomNumber", getRoomNumber(booking.getRoomId()));
                    detail.put("phoneNumber", booking.getCustomerPhoneNumber());
                    detail.put("bookingId", booking.getId());
                    detail.put("bookingStatus", booking.getBookingStatus());
                    detail.put("dueAmount", actualDueAmount);
                    return detail;
                })
                .collect(java.util.stream.Collectors.toList());

            List<Map<String, Object>> checkOutDetails = checkOuts.stream()
                .map(booking -> {
                    // Calculate actual due amount (total - paid)
                    List<Payment> payments = paymentRepository.findByBookingId(booking.getId());
                    double totalPaid = payments.stream()
                        .mapToDouble(payment -> payment.getAmount().doubleValue())
                        .sum();
                    double totalAmount = booking.getTotalAmount() != null ? booking.getTotalAmount().doubleValue() : 0.0;
                    double actualDueAmount = totalAmount - totalPaid;
                    
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("customerName", getCustomerName(booking.getCustomerPhoneNumber()));
                    detail.put("roomNumber", getRoomNumber(booking.getRoomId()));
                    detail.put("phoneNumber", booking.getCustomerPhoneNumber());
                    detail.put("bookingId", booking.getId());
                    detail.put("bookingStatus", booking.getBookingStatus());
                    detail.put("dueAmount", actualDueAmount);
                    return detail;
                })
                .collect(java.util.stream.Collectors.toList());


            // Get pending dues for ALL customers with unpaid amounts (any booking status)
            // Include all bookings that have pending dues (total amount > paid amount)
            List<Booking> allBookingsForPendingDues = bookingRepository.findAll().stream()
            .filter(booking -> BookingStatus.CHECKEDIN.toString().equalsIgnoreCase(String.valueOf(booking.getBookingStatus())))
            .collect(Collectors.toList());
            
            // Filter bookings that have pending dues (total amount > paid amount)
            List<Booking> pendingDues = allBookingsForPendingDues.stream()
                .filter(booking -> {
                    // Fetch payments for this booking
                    List<Payment> payments = paymentRepository.findByBookingId(booking.getId());
                    
                    // Calculate total paid amount for this booking
                    double totalPaid = payments.stream()
                        .mapToDouble(payment -> payment.getAmount().doubleValue())
                        .sum();
                    
                    // Check if there are pending dues
                    double totalAmount = booking.getTotalAmount() != null ? booking.getTotalAmount().doubleValue() : 0.0;
                    return totalAmount > totalPaid;
                })
                .collect(java.util.stream.Collectors.toList());
            List<Map<String, Object>> pendingDuesDetails = pendingDues.stream()
                .map(booking -> {
                    // Calculate actual pending amount (total - paid)
                    List<Payment> payments = paymentRepository.findByBookingId(booking.getId());
                    double totalPaid = payments.stream()
                        .mapToDouble(payment -> payment.getAmount().doubleValue())
                        .sum();
                    double totalAmount = booking.getTotalAmount() != null ? booking.getTotalAmount().doubleValue() : 0.0;
                    double actualDueAmount = totalAmount - totalPaid;
                    
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("customerName", getCustomerName(booking.getCustomerPhoneNumber()));
                    detail.put("roomNumber", getRoomNumber(booking.getRoomId()));
                    detail.put("phoneNumber", booking.getCustomerPhoneNumber());
                    detail.put("dueAmount", actualDueAmount);
                    detail.put("checkInDate", booking.getCheckInDate().toLocalDate().toString());
                    detail.put("checkOutDate", booking.getCheckOutDate().toLocalDate().toString());
                    detail.put("bookingId", booking.getId());
                    detail.put("bookingStatus", booking.getBookingStatus());
                    detail.put("totalAmount", totalAmount);
                    detail.put("totalPaid", totalPaid);
                    return detail;
                })
                .collect(java.util.stream.Collectors.toList());

            Map<String, Object> summary = new HashMap<>();
            summary.put("date", date);
            summary.put("totalCustomers", totalCustomers);
            summary.put("totalRooms", totalRooms);
            summary.put("availableRooms", availableRooms);
            summary.put("occupiedRooms", occupiedRooms);
            summary.put("occupancyRate", Math.round(occupancyRate * 100.0) / 100.0);
            summary.put("todayBookings", todayBookings.size());
            summary.put("checkIns", checkInDetails);
            summary.put("checkOuts", checkOutDetails);
            summary.put("pendingDues", pendingDuesDetails);
            // Calculate total revenue from all bookings
            List<Booking> allBookingsForRevenue = bookingRepository.findAll();
            summary.put("revenue", calculateTodayRevenue(allBookingsForRevenue));

            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to fetch summary data: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping("/recent-bookings")
    public ResponseEntity<List<Booking>> getRecentBookings(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<Booking> recentBookings = bookingRepository.findTop10ByOrderByCreatedAtDesc();
            return ResponseEntity.ok(recentBookings);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/room-occupancy")
    public ResponseEntity<Map<String, Object>> getRoomOccupancy() {
        try {
            long totalRooms = roomRepository.count();
            long availableRooms = roomRepository.countByIsAvailableTrue();
            long occupiedRooms = totalRooms - availableRooms;

            Map<String, Object> occupancy = new HashMap<>();
            occupancy.put("totalRooms", totalRooms);
            occupancy.put("availableRooms", availableRooms);
            occupancy.put("occupiedRooms", occupiedRooms);
            occupancy.put("occupancyRate", totalRooms > 0 ? Math.round((double) occupiedRooms / totalRooms * 10000.0) / 100.0 : 0);

            return ResponseEntity.ok(occupancy);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private double calculateTodayRevenue(List<Booking> bookings) {
        return bookings.stream()
            .filter(booking -> booking.getTotalAmount() != null)
            .mapToDouble(booking -> booking.getTotalAmount().doubleValue())
            .sum();
    }

    private String getCustomerName(String phoneNumber) {
        try {
            Customer customer = customerRepository.findByPhoneNumber(phoneNumber);
            return customer != null ? customer.getName() : "Unknown Customer";
        } catch (Exception e) {
            return "Unknown Customer";
        }
    }

    private String getRoomNumber(Long roomId) {
        try {
            Room room = roomRepository.findById(roomId).orElse(null);
            return room != null ? room.getRoomNumber() : "Room " + roomId;
        } catch (Exception e) {
            return "Room " + roomId;
        }
    }
}

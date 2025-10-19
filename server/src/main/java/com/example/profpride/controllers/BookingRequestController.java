package com.example.profpride.controllers;

import com.example.profpride.models.BookingRequest;
import com.example.profpride.services.BookingRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/booking-requests")
public class BookingRequestController {

    @Autowired
    private BookingRequestService bookingRequestService;

    @PostMapping
    public ResponseEntity<?> createBookingRequest(@RequestBody BookingRequest bookingRequest) {
        try {
            BookingRequest savedRequest = bookingRequestService.createBookingRequest(bookingRequest);
            
            // Return response in format expected by frontend
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("id", savedRequest.getId());
            response.put("message", "Booking request created successfully");
            response.put("data", savedRequest);
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            
            return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping
    public ResponseEntity<List<BookingRequest>> getAllBookingRequests() {
        List<BookingRequest> requests = bookingRequestService.getAllBookingRequests();
        return new ResponseEntity<>(requests, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingRequest> getBookingRequestById(@PathVariable Long id) {
        Optional<BookingRequest> request = bookingRequestService.getBookingRequestById(id);
        if (request.isPresent()) {
            return new ResponseEntity<>(request.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookingRequest> updateBookingRequest(@PathVariable Long id, @RequestBody BookingRequest updatedRequest) {
        try {
            BookingRequest savedRequest = bookingRequestService.updateBookingRequest(id, updatedRequest);
            return new ResponseEntity<>(savedRequest, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBookingRequest(@PathVariable Long id) {
        try {
            bookingRequestService.deleteBookingRequest(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/customer/{phoneNumber}")
    public ResponseEntity<List<BookingRequest>> getBookingRequestsByCustomer(@PathVariable String phoneNumber) {
        List<BookingRequest> requests = bookingRequestService.getCustomerBookingRequests(phoneNumber);
        return new ResponseEntity<>(requests, HttpStatus.OK);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<BookingRequest>> getBookingRequestsByStatus(@PathVariable String status) {
        try {
            com.example.profpride.enums.BookingRequestStatus requestStatus = 
                com.example.profpride.enums.BookingRequestStatus.valueOf(status.toUpperCase());
            List<BookingRequest> requests = bookingRequestService.getBookingRequestsByStatus(requestStatus);
            return new ResponseEntity<>(requests, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<BookingRequest> approveBookingRequest(@PathVariable Long id) {
        try {
            BookingRequest approvedRequest = bookingRequestService.approveBookingRequest(id);
            return new ResponseEntity<>(approvedRequest, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<BookingRequest> rejectBookingRequest(@PathVariable Long id) {
        try {
            BookingRequest rejectedRequest = bookingRequestService.rejectBookingRequest(id);
            return new ResponseEntity<>(rejectedRequest, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}

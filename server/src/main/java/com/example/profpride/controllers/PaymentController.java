package com.example.profpride.controllers;

import com.example.profpride.models.Payment;
import com.example.profpride.services.PaymentService;
import com.example.profpride.services.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<?> createPayment(@RequestBody Payment payment) {
        try {
            Payment savedPayment = paymentService.createPayment(payment);
            return new ResponseEntity<>(savedPayment, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to create payment: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        List<Payment> payments = paymentService.getAllPayments();
        return new ResponseEntity<>(payments, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable Long id) {
        Optional<Payment> payment = paymentService.getPaymentById(id);
        if (payment.isPresent()) {
            return new ResponseEntity<>(payment.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayment(@PathVariable Long id, @RequestBody Payment updatedPayment) {
        try {
            Payment savedPayment = paymentService.updatePayment(id, updatedPayment);
            return new ResponseEntity<>(savedPayment, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to update payment: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        try {
            paymentService.deletePayment(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Payment>> getPaymentsByBooking(@PathVariable Long bookingId) {
        List<Payment> payments = paymentService.getPaymentsByBookingId(bookingId);
        return new ResponseEntity<>(payments, HttpStatus.OK);
    }

    @PostMapping("/upload-screenshot-new")
    public ResponseEntity<Map<String, Object>> uploadPaymentScreenshotNew(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "No file provided");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file size (10MB limit)
            if (file.getSize() > 10 * 1024 * 1024) {
                response.put("success", false);
                response.put("message", "File size too large. Maximum size is 10MB");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("message", "Invalid file type. Only image files are allowed");
                return ResponseEntity.badRequest().body(response);
            }

            // Use provided phone number or default if not provided
            String phoneNumberToUse = (phoneNumber != null && !phoneNumber.isEmpty()) ? phoneNumber : "default";
            String paymentScreenshotUrl = cloudinaryService.uploadPaymentScreenshot(file, phoneNumberToUse);
            
            response.put("success", true);
            response.put("fileUrl", paymentScreenshotUrl);
            response.put("message", "Payment screenshot uploaded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Failed to upload payment screenshot: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/cash-filter")
    public ResponseEntity<Map<String, Object>> getCashFilter(
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam(value = "paymentMode", defaultValue = "CARETAKER") String paymentMode) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Parse dates
            LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
            LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
            
            // Get filtered payments
            List<Payment> filteredPayments = paymentService.getPaymentsByDateRangeAndMode(start, end, paymentMode);
            
            // Calculate total amount (all payments are considered valid)
            BigDecimal totalAmount = filteredPayments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            response.put("success", true);
            response.put("amountInHand", totalAmount);
            response.put("paymentCount", filteredPayments.size());
            response.put("startDate", startDate);
            response.put("endDate", endDate);
            response.put("paymentMode", paymentMode);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error calculating cash filter: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}

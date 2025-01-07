package com.example.profpride.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.profpride.enums.PaymentMode;
import com.example.profpride.models.Booking;
import com.example.profpride.models.Payment;
import com.example.profpride.repositories.BookingRepository;
import com.example.profpride.repositories.PaymentRepository;
import com.example.profpride.services.PaymentService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private PaymentService paymentService;

    @PostMapping
    public ResponseEntity<Payment> createPayment(@RequestBody Map<String, Object> payload) {
        System.out.println("Payload: " + payload);
        Integer amount = (Integer) payload.get("amount");
        LocalDateTime createdAt = LocalDateTime.parse((String) payload.get("createdAt"));
        PaymentMode mode = PaymentMode.valueOf((String) payload.get("mode"));
        Long bookingId = Long.valueOf((Integer) payload.get("bookingId"));
        System.out.println("Booking ID: " + bookingId);

        // Find booking by id
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        System.out.println("Booking: " + booking);

        Payment payment = new Payment(null, amount, createdAt, mode, booking);

        System.out.println("Payment: " + payment);
        return ResponseEntity.ok(paymentService.savePayment(payment));
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        List<Payment> payments = paymentRepository.findAll();
        return new ResponseEntity<>(payments, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable Long id) {
        Optional<Payment> payment = paymentRepository.findById(id);
        if (payment.isPresent()) {
            return new ResponseEntity<>(payment.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Payment> updatePayment(@PathVariable Long id, @RequestBody Payment updatedPayment) {
        return paymentRepository.findById(id).map(payment -> {
            payment.setAmount(updatedPayment.getAmount());
            payment.setMode(updatedPayment.getMode());
            payment.setCreatedAt(updatedPayment.getCreatedAt());
            Payment savedPayment = paymentRepository.save(payment);
            return new ResponseEntity<>(savedPayment, HttpStatus.OK);
        }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        return paymentRepository.findById(id).map(payment -> {
            paymentRepository.delete(payment);
            return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
        }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
}

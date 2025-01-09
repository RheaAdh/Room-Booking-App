package com.example.profpride.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.profpride.enums.PaymentMode;
import com.example.profpride.models.Booking;
import com.example.profpride.models.Payment;
import com.example.profpride.repositories.BookingRepository;
import com.example.profpride.repositories.PaymentRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public Payment createPayment(Map<String, Object> payload) {
        Integer amount = (Integer) payload.get("amount");
        LocalDateTime createdAt = LocalDateTime.parse((String) payload.get("createdAt"));
        PaymentMode mode = PaymentMode.valueOf((String) payload.get("mode"));
        Long bookingId = Long.valueOf((Integer) payload.get("bookingId"));

        // Find booking by id
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        Payment payment = new Payment(null, amount, createdAt, mode, booking);

        // You may add business logic here, like updating the booking's due amount

        return paymentRepository.save(payment);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }

    public Payment updatePayment(Long id, Payment updatedPayment) {
        return paymentRepository.findById(id).map(payment -> {
            payment.setAmount(updatedPayment.getAmount());
            payment.setMode(updatedPayment.getMode());
            payment.setCreatedAt(updatedPayment.getCreatedAt());
            return paymentRepository.save(payment);
        }).orElse(null);
    }

    public boolean deletePayment(Long id) {
        return paymentRepository.findById(id).map(payment -> {
            paymentRepository.delete(payment);
            return true;
        }).orElse(false);
    }
}

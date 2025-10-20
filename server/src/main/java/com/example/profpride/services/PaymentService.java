package com.example.profpride.services;

import com.example.profpride.models.Payment;
import com.example.profpride.models.Booking;
import com.example.profpride.repositories.PaymentRepository;
import com.example.profpride.repositories.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private BookingRepository bookingRepository;

    public Payment createPayment(Payment payment) {
        // Handle payment date if it's null
        if (payment.getPaymentDate() == null) {
            payment.setPaymentDate(LocalDateTime.now());
        }
        
        return paymentRepository.save(payment);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }

    public Payment updatePayment(Long id, Payment updatedPayment) {
        if (paymentRepository.existsById(id)) {
            updatedPayment.setId(id);
            return paymentRepository.save(updatedPayment);
        } else {
            throw new RuntimeException("Payment not found with id: " + id);
        }
    }

    public void deletePayment(Long id) {
        if (paymentRepository.existsById(id)) {
            paymentRepository.deleteById(id);
        } else {
            throw new RuntimeException("Payment not found with id: " + id);
        }
    }

    public List<Payment> getPaymentsByBookingId(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId);
    }
    
    
    /**
     * Gets the total amount paid for a booking
     * @param bookingId The booking ID
     * @return Total paid amount
     */
    private BigDecimal getTotalPaidAmount(Long bookingId) {
        List<Payment> payments = paymentRepository.findByBookingId(bookingId);
        return payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    /**
     * Gets payments by date range and payment mode
     * @param startDate Start date
     * @param endDate End date
     * @param paymentMode Payment mode
     * @return List of payments
     */
    public List<Payment> getPaymentsByDateRangeAndMode(LocalDateTime startDate, LocalDateTime endDate, String paymentMode) {
        return paymentRepository.findByPaymentDateBetweenAndPaymentMethod(
            startDate, 
            endDate, 
            com.example.profpride.enums.PaymentMode.valueOf(paymentMode)
        );
    }
}

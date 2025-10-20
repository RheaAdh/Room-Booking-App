package com.example.profpride.repositories;

import com.example.profpride.models.Payment;
import com.example.profpride.enums.PaymentMode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBookingId(Long bookingId);
    
    List<Payment> findByPaymentDateBetweenAndPaymentMethod(
        LocalDateTime startDate, 
        LocalDateTime endDate, 
        PaymentMode paymentMode
    );
}

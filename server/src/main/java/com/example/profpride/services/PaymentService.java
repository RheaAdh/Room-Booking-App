package com.example.profpride.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.profpride.models.Booking;
import com.example.profpride.models.Payment;
import com.example.profpride.repositories.BookingRepository;
import com.example.profpride.repositories.PaymentRepository;

@Service
public class PaymentService {
    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public Payment savePayment(Payment payment) {
        Booking booking = bookingRepository.findById(payment.getBooking().getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Booking with ID " + payment.getBooking().getId() + " not found"));

        payment.setBooking(booking);
        return paymentRepository.save(payment);
    }
}

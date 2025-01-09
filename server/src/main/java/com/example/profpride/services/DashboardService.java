package com.example.profpride.services;

import com.example.profpride.models.Booking;
import com.example.profpride.repositories.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private BookingRepository bookingRepository;

    public List<Booking> getArrivals() {
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream()
                .filter(booking -> booking.getCheckInDate().getDayOfYear() == LocalDateTime.now().getDayOfYear())
                .collect(Collectors.toList());
    }

    public List<Booking> getDepartures() {
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream()
                .filter(booking -> booking.getCheckOutDate().getDayOfYear() == LocalDateTime.now().getDayOfYear())
                .collect(Collectors.toList());
    }

    public List<Booking> getDueList() {
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream()
                .filter(booking -> {
                    int totalAmountPaid = booking.getPayments().stream().mapToInt(payment -> payment.getAmount()).sum();
                    int totalAmountDue = 100
                            * (booking.getCheckOutDate().getDayOfYear() - booking.getCheckInDate().getDayOfYear());
                    return totalAmountPaid < totalAmountDue;
                })
                .collect(Collectors.toList());
    }
}

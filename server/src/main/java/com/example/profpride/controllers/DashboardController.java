package com.example.profpride.controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.profpride.models.Booking;
import com.example.profpride.repositories.BookingRepository;

@RestController
@RequestMapping("/api/v1")
public class DashboardController {

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping("/arrivals")
    public ResponseEntity<List<Booking>> getArrivals() {
        List<Booking> bookings = bookingRepository.findAll();
        bookings = bookings.stream()
                .filter(booking -> booking.getCheckInDate().getDayOfYear() == LocalDateTime.now().getDayOfYear())
                .collect(Collectors.toList());
        return new ResponseEntity<>(bookings, HttpStatus.OK);
    }

    @GetMapping("/departures")
    public ResponseEntity<List<Booking>> getDepartures() {
        List<Booking> bookings = bookingRepository.findAll();
        bookings = bookings.stream()
                .filter(booking -> booking.getCheckOutDate().getDayOfYear() == LocalDateTime.now().getDayOfYear())
                .collect(Collectors.toList());
        return new ResponseEntity<>(bookings, HttpStatus.OK);
    }

    @GetMapping("/due")
    public ResponseEntity<List<Booking>> getDueList() {
        List<Booking> bookings = bookingRepository.findAll();
        List<Booking> dueList = bookings.stream().filter(booking -> {
            int totalAmountPaid = booking.getPayments().stream().mapToInt(payment -> payment.getAmount()).sum();
            int totalAmountDue = 0;
            int days = booking.getCheckOutDate().getDayOfYear() - booking.getCheckInDate().getDayOfYear();
            if (days > 30) {
                totalAmountDue = booking.getRoom().getRoomMonthlyCost() * (days / 30);
            } else {
                totalAmountDue = booking.getRoom().getRoomDailyCost() * days;
            }
            if (totalAmountPaid < totalAmountDue) {
                return true;
            }
            return false;
        }).collect(Collectors.toList());
        return new ResponseEntity<>(dueList, HttpStatus.OK);
    }
}
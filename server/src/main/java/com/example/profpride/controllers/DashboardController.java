package com.example.profpride.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.profpride.repositories.BookingRepository;
import com.example.profpride.repositories.PaymentRepository;
import com.example.profpride.repositories.RoomRepository;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private RoomRepository roomRepository;

}
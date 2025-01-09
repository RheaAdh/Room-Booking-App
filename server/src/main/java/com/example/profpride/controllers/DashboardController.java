package com.example.profpride.controllers;

import com.example.profpride.models.Booking;
import com.example.profpride.services.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/arrivals")
    public ResponseEntity<List<Booking>> getArrivals() {
        List<Booking> bookings = dashboardService.getArrivals();
        return new ResponseEntity<>(bookings, HttpStatus.OK);
    }

    @GetMapping("/departures")
    public ResponseEntity<List<Booking>> getDepartures() {
        List<Booking> bookings = dashboardService.getDepartures();
        return new ResponseEntity<>(bookings, HttpStatus.OK);
    }

    @GetMapping("/due")
    public ResponseEntity<List<Booking>> getDueList() {
        List<Booking> dueList = dashboardService.getDueList();
        return new ResponseEntity<>(dueList, HttpStatus.OK);
    }
}

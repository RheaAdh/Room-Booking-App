package com.example.profpride.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.profpride.entities.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {

}
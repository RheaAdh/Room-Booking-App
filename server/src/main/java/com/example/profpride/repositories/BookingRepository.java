package com.example.profpride.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.profpride.models.Booking;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

}
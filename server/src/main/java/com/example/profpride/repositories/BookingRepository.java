package com.example.profpride.repositories;

import com.example.profpride.models.Booking;
import com.example.profpride.models.Room;
import com.example.profpride.enums.BookingStatus;
import com.example.profpride.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByRoom(Room room);
    List<Booking> findByCustomerPhoneNumber(String customerPhoneNumber);
    List<Booking> findByBookingStatus(BookingStatus status);
    
    // Dashboard queries
    List<Booking> findByCheckInDateBetween(LocalDateTime start, LocalDateTime end);
    List<Booking> findByCheckOutDateBetween(LocalDateTime start, LocalDateTime end);
    List<Booking> findTop10ByOrderByCreatedAtDesc();
    
        @Query("SELECT b FROM Booking b WHERE (b.checkInDate BETWEEN :start1 AND :end1) OR (b.checkOutDate BETWEEN :start2 AND :end2)")
        List<Booking> findByCheckInDateBetweenOrCheckOutDateBetween(LocalDateTime start1, LocalDateTime end1, LocalDateTime start2, LocalDateTime end2);
        
        List<Booking> findByPaymentStatus(PaymentStatus paymentStatus);
}

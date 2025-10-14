package com.example.profpride.repositories;

import com.example.profpride.models.BookingRequest;
import com.example.profpride.enums.BookingRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRequestRepository extends JpaRepository<BookingRequest, Long> {
    List<BookingRequest> findByStatus(BookingRequestStatus status);
    List<BookingRequest> findByCustomerPhone(String customerPhone);
}

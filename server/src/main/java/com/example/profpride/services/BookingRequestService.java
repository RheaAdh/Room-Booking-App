package com.example.profpride.services;

import com.example.profpride.models.BookingRequest;
import com.example.profpride.models.Room;
import com.example.profpride.repositories.BookingRequestRepository;
import com.example.profpride.repositories.RoomRepository;
import com.example.profpride.enums.BookingRequestStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class BookingRequestService {

    @Autowired
    private BookingRequestRepository bookingRequestRepository;

    @Autowired
    private RoomRepository roomRepository;

    public BookingRequest createBookingRequest(BookingRequest bookingRequest) {
        // Verify room exists
        Optional<Room> roomOpt = roomRepository.findById(bookingRequest.getRoomId());
        if (!roomOpt.isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room not found");
        }

        bookingRequest.setStatus(BookingRequestStatus.PENDING);
        return bookingRequestRepository.save(bookingRequest);
    }

    public List<BookingRequest> getAllBookingRequests() {
        return bookingRequestRepository.findAll();
    }

    public List<BookingRequest> getPendingBookingRequests() {
        return bookingRequestRepository.findByStatus(BookingRequestStatus.PENDING);
    }

    public List<BookingRequest> getCustomerBookingRequests(String phoneNumber) {
        return bookingRequestRepository.findByCustomerPhone(phoneNumber);
    }

    public Optional<BookingRequest> getBookingRequestById(Long id) {
        return bookingRequestRepository.findById(id);
    }

    public BookingRequest updateBookingRequestStatus(Long id, BookingRequestStatus status, String remarks) {
        return bookingRequestRepository.findById(id).map(bookingRequest -> {
            bookingRequest.setStatus(status);
            if (remarks != null) {
                bookingRequest.setRemarks(remarks);
            }
            return bookingRequestRepository.save(bookingRequest);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking request not found"));
    }

    public BookingRequest approveBookingRequest(Long id) {
        return updateBookingRequestStatus(id, BookingRequestStatus.APPROVED, null);
    }

    public BookingRequest rejectBookingRequest(Long id) {
        return updateBookingRequestStatus(id, BookingRequestStatus.REJECTED, null);
    }

    public void deleteBookingRequest(Long id) {
        if (bookingRequestRepository.existsById(id)) {
            bookingRequestRepository.deleteById(id);
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking request not found");
        }
    }

    public BookingRequest updateBookingRequest(Long id, BookingRequest updatedRequest) {
        if (bookingRequestRepository.existsById(id)) {
            updatedRequest.setId(id);
            return bookingRequestRepository.save(updatedRequest);
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking request not found");
        }
    }

    public List<BookingRequest> getBookingRequestsByCustomerPhone(String phoneNumber) {
        return bookingRequestRepository.findByCustomerPhone(phoneNumber);
    }

    public List<BookingRequest> getBookingRequestsByStatus(BookingRequestStatus status) {
        return bookingRequestRepository.findByStatus(status);
    }
}

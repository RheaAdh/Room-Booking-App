package com.example.profpride.services;

import com.example.profpride.enums.BookingDurationType;
import com.example.profpride.models.Booking;
import com.example.profpride.models.Customer;
import com.example.profpride.models.Room;
import com.example.profpride.models.RoomCost;
import com.example.profpride.repositories.BookingRepository;
import com.example.profpride.repositories.CustomerRepository;
import com.example.profpride.repositories.RoomRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RoomCostService roomCostService;

    public Booking createBooking(Booking booking) {
        // Calculate the number of days the guest stays
        int days = booking.getCheckOutDate().getDayOfYear() - booking.getCheckInDate().getDayOfYear();

        List<RoomCost> roomCostList = roomCostService.getAllRoomCosts();
        int roomCost = 0;
        // traverse the roomCostList and verify the conditions match based on the
        // RoomType,
        // BathroomType, and BookingDurationType
        for (RoomCost cost : roomCostList) {
            if (cost.getRoomType().equals(booking.getRoom().getRoomType()) &&
                    cost.getBathroomType().equals(booking.getRoom().getBathroomType())) {
                if (days > 30 && cost.getBookingDurationType().equals(BookingDurationType.MONTHLY)) {
                    roomCost = days * cost.getCost();
                    break;
                } else if (days < 30 && cost.getBookingDurationType().equals(BookingDurationType.DAILY)) {
                    roomCost = cost.getCost();
                    break;
                }
            }
        }
        booking.setDueAmount((long) (roomCost * days));
        return bookingRepository.save(booking);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Optional<Booking> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }

    public Booking updateBooking(Long id, Booking updatedBooking) {
        return bookingRepository.findById(id).map(booking -> {
            // Update booking details
            booking.setBookingStatus(updatedBooking.getBookingStatus());
            booking.setCheckInDate(updatedBooking.getCheckInDate());
            booking.setCheckOutDate(updatedBooking.getCheckOutDate());
            booking.setDueAmount(updatedBooking.getDueAmount());

            // Update room if changed
            if (updatedBooking.getRoom() != null
                    && !updatedBooking.getRoom().getId().equals(booking.getRoom().getId())) {
                Room newRoom = roomRepository.findById(updatedBooking.getRoom().getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Room ID"));
                booking.setRoom(newRoom);
            }

            // Update customer if changed
            if (updatedBooking.getCustomer() != null
                    && !updatedBooking.getCustomer().getId().equals(booking.getCustomer().getId())) {
                Customer newCustomer = customerRepository.findById(updatedBooking.getCustomer().getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Customer ID"));
                booking.setCustomer(newCustomer);
            }

            return bookingRepository.save(booking);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        bookingRepository.delete(booking);
    }
}

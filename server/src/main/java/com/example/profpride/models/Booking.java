package com.example.profpride.models;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import com.example.profpride.enums.BookingDurationType;
import com.example.profpride.enums.BookingStatusType;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "booking")
public class Booking {
  @Id
  @GeneratedValue(strategy = GenerationType.SEQUENCE)
  private Long id;
  private LocalDateTime checkInDate;
  private LocalDateTime checkOutDate;
  private Long dueAmount;

  @Enumerated(EnumType.STRING)
  private BookingStatusType bookingStatus;

  @ManyToOne // multiple bookings can exist for a single room
  @JoinColumn(name = "room_id", nullable = false)
  public Room room;

  @ManyToOne // a Customer can have multiple bookings
  @JoinColumn(name = "customer_id", nullable = false)
  private Customer customer;

  @OneToMany(mappedBy = "booking") // a booking can have multiple payments
  private List<Payment> payments;
}
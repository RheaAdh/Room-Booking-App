package com.example.profpride.models;

import jakarta.persistence.CascadeType;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "booking")
public class Booking {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;
  private LocalDate startDate;
  private LocalDate endDate;
  private LocalDateTime updatedAt;
  private LocalDateTime createdAt;

  @Enumerated(EnumType.STRING)
  private StatusType bookingStatus;

  @Enumerated(EnumType.STRING)
  private DurationType durationType;

  @ManyToOne // multiple bookings can exist for a single room
  @JoinColumn(name = "room_id", nullable = false)
  private Room room;

  @ManyToOne // a Customer can have multiple bookings
  @JoinColumn(name = "customer_id", nullable = false)
  private Customer customer;

  @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
  private List<Payment> payments;
}

enum StatusType {
  NEW, PENDING, CONFIRMED, CANCELLED, CHECKED_IN, CHECKED_OUT
}

enum DurationType {
  DAILY, WEEKLY, MONTHLY
}
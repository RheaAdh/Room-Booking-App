package com.example.profpride.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.*;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "payment")
public class Payment {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;
  private Integer amount;
  private LocalDate createdAt;
  private PaymentMode mode;

  @ManyToOne
  @JoinColumn(name = "booking_id", nullable = false)
  private Booking booking;
}

enum PaymentMode {
  CREDIT_CARD, DEBIT_CARD, UPI, CASH, NET_BANKING, CARE_TAKER
}
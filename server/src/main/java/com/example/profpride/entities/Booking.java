package com.example.profpride.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;
import java.util.Date;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Booking {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;
  private Long customerId;
  private String roomId;
  private StatusType status;
  private Date startDate;
  private Date endDate;
}

enum StatusType {
  NEW, PENDING, CONFIRMED, CANCELLED, CHECKED_IN, CHECKED_OUT
}
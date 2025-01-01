package com.example.profpride.models;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "room")
public class Room {

  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private Long id;
  private String roomNumber; // unique - 201A
  private Integer floor;
  private Integer capacity;
  private RoomType roomType;
  private BathroomType bathroomType;

  @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
  private List<Booking> bookings;
}

enum RoomType {
  SINGLE, DOUBLE, TRIPLE, QUEEN
}

enum BathroomType {
  ATTACHED, COMMON
}
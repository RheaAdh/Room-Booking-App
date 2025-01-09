package com.example.profpride.models;

import java.util.List;
import com.example.profpride.enums.BathroomType;
import com.example.profpride.enums.RoomType;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
  private String roomNumber;
  private RoomType roomType;
  private BathroomType bathroomType;

  @OneToMany(mappedBy = "room")
  @JsonIgnore
  private List<Booking> bookings;
}
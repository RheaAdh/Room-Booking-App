package com.example.profpride;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
public class Room {
    
  @Id
  @GeneratedValue(strategy=GenerationType.AUTO)
    private Long id;
    private String roomNumber; //unique - 201A
    private Integer floor;
    private Integer capacity;
    private RoomType roomType;
    private BathroomType bathroomType;
}

enum RoomType { SINGLE, DOUBLE, TRIPLE } 

enum BathroomType { ATTACHED, NON_ATTACHED }
package com.example.profpride.models;

import com.example.profpride.enums.BathroomType;
import com.example.profpride.enums.BookingDurationType;
import com.example.profpride.enums.RoomType;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "roomcost")
public class RoomCost {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    BathroomType bathroomType;
    RoomType roomType;
    BookingDurationType bookingDurationType;
    Integer cost;
}

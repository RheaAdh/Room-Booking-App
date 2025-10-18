package com.example.profpride.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.example.profpride.enums.BathroomType;

@Entity
@Table(name = "room")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Room extends BaseEntity {
    
    @Column(name = "room_number", unique = true, nullable = false)
    private String roomNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "bathroom_type", nullable = false)
    private BathroomType bathroomType;
    
    @Column(name = "is_available")
    private Boolean isAvailable = true;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    // Room configurations are managed separately through RoomConfigurationService
}

package com.example.profpride.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "room_configuration")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RoomConfiguration extends BaseEntity {

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "person_count", nullable = false)
    private Integer personCount;

    @Column(name = "daily_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal dailyCost;

    @Column(name = "monthly_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal monthlyCost;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}

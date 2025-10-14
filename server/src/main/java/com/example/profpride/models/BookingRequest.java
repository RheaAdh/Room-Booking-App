package com.example.profpride.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.example.profpride.enums.BookingDurationType;
import com.example.profpride.enums.BookingRequestStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_request")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class BookingRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "customer_name", nullable = false)
    private String customerName;
    
    @Column(name = "customer_phone", length = 20, nullable = false)
    private String customerPhone;
    
    @Column(name = "room_id", nullable = false)
    private Long roomId;
    
    @Column(name = "check_in_date", nullable = false)
    private LocalDateTime checkInDate;
    
    @Column(name = "check_out_date", nullable = false)
    private LocalDateTime checkOutDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "booking_duration_type", nullable = false)
    private BookingDurationType bookingDurationType;
    
    @Column(name = "daily_cost", precision = 10, scale = 2)
    private BigDecimal dailyCost = BigDecimal.ZERO;
    
    @Column(name = "monthly_cost", precision = 10, scale = 2)
    private BigDecimal monthlyCost = BigDecimal.ZERO;
    
    @Column(name = "early_checkin_cost", precision = 10, scale = 2)
    private BigDecimal earlyCheckinCost = BigDecimal.ZERO;
    
    @Column(name = "total_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BookingRequestStatus status = BookingRequestStatus.PENDING;
    
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

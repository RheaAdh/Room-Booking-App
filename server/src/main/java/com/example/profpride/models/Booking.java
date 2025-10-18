package com.example.profpride.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.example.profpride.enums.BookingDurationType;
import com.example.profpride.enums.BookingStatus;
import com.example.profpride.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Booking extends BaseEntity {
    
    @Column(name = "customer_phone_number", length = 20, nullable = false)
    private String customerPhoneNumber;
    
    @Column(name = "room_id", nullable = false)
    private Long roomId;
    
    @Column(name = "number_of_people", nullable = false)
    private Integer numberOfPeople = 1;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", insertable = false, updatable = false)
    @JsonIgnore
    private Room room;
    
    @Column(name = "check_in_date", nullable = false)
    private LocalDateTime checkInDate;
    
    @Column(name = "check_out_date", nullable = false)
    private LocalDateTime checkOutDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "booking_duration_type", nullable = false)
    private BookingDurationType bookingDurationType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "booking_status", nullable = false)
    private BookingStatus bookingStatus = BookingStatus.CONFIRMED;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    
    @Column(name = "daily_cost", precision = 10, scale = 2)
    private BigDecimal dailyCost = BigDecimal.ZERO;
    
    @Column(name = "monthly_cost", precision = 10, scale = 2)
    private BigDecimal monthlyCost = BigDecimal.ZERO;
    
    @Column(name = "early_checkin_cost", precision = 10, scale = 2)
    private BigDecimal earlyCheckinCost = BigDecimal.ZERO;
    
    @Column(name = "late_checkout_cost", precision = 10, scale = 2)
    private BigDecimal lateCheckoutCost = BigDecimal.ZERO;
    
    @Column(name = "total_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalAmount;
    
    @Column(name = "remarks", length = 500)
    private String remarks;
}

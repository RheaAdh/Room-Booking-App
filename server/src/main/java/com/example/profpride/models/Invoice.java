package com.example.profpride.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "invoice")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Invoice extends BaseEntity {

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "invoice_number", length = 50, nullable = false, unique = true)
    private String invoiceNumber;

    @Column(name = "total_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal finalAmount;

    @Column(name = "status", length = 20, nullable = false)
    private String status = "GENERATED";

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (invoiceNumber == null) {
            invoiceNumber = "INV-" + System.currentTimeMillis();
        }
    }
}

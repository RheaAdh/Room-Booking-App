package com.example.profpride.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.example.profpride.enums.ExpenseCategory;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "expense")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Expense extends BaseEntity {

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private ExpenseCategory category;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (expenseDate == null) {
            expenseDate = LocalDate.now();
        }
    }
}

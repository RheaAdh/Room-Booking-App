package com.example.profpride.repositories;

import com.example.profpride.models.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByCategory(com.example.profpride.enums.ExpenseCategory category);
}

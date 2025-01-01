package com.example.profpride.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.profpride.entities.Expense;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

}
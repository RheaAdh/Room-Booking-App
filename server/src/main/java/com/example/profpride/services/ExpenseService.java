package com.example.profpride.services;

import com.example.profpride.models.Expense;
import com.example.profpride.repositories.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    public Expense createExpense(Expense expense) {
        return expenseRepository.save(expense);
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Optional<Expense> getExpenseById(Long id) {
        return expenseRepository.findById(id);
    }

    public Expense updateExpense(Long id, Expense updatedExpense) {
        return expenseRepository.findById(id).map(expense -> {
            expense.setName(updatedExpense.getName());
            expense.setDescription(updatedExpense.getDescription());
            expense.setAmount(updatedExpense.getAmount());
            expense.setCreatedAt(updatedExpense.getCreatedAt());
            return expenseRepository.save(expense);
        }).orElse(null);
    }

    public boolean deleteExpense(Long id) {
        return expenseRepository.findById(id).map(expense -> {
            expenseRepository.delete(expense);
            return true;
        }).orElse(false);
    }
}

package com.example.profpride.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.profpride.models.Payment;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

}
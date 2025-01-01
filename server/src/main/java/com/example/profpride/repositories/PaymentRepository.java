package com.example.profpride.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.profpride.entities.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

}
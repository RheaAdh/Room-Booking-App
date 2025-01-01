package com.example.profpride.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.profpride.models.Customer;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

}
package com.example.profpride.repositories;

import com.example.profpride.models.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Customer findByPhoneNumber(String phoneNumber);
}

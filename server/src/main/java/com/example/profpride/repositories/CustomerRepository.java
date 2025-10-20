package com.example.profpride.repositories;

import com.example.profpride.models.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Customer findByPhoneNumber(String phoneNumber);
    
    @Query("SELECT DISTINCT c FROM Customer c LEFT JOIN FETCH c.idProofUrls")
    List<Customer> findAllWithIdProofUrls();
}

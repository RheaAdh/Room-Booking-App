package com.example.profpride.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.profpride.entities.Contact;

public interface ContactRepository extends JpaRepository<Contact, Long> {

}
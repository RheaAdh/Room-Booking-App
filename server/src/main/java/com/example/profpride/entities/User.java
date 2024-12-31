package com.example.profpride;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
public class User {
    @Id
  @GeneratedValue(strategy=GenerationType.AUTO)
    private Long id;
    private String name;
    private String phoneNumber;
    private String email;
}
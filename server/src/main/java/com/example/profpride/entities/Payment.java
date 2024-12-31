package com.example.profpride;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;
import java.util.Date;

@Entity
@Getter
@Setter
@AllArgsConstructor
public class Payment {
   @Id
  @GeneratedValue(strategy=GenerationType.AUTO)
    private Long id;
    private Integer amount; //unique - 201A
    private Date createdAt;
    private Integer mode;
    private Long bookingId;
}
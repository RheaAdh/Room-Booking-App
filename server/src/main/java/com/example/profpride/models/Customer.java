package com.example.profpride.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "customer")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Customer {
    
    @Id
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "email")
    private String email;
    
    @Column(name = "password")
    private String password;
    
    @Column(name = "additional_phone_number", length = 20)
    private String additionalPhoneNumber;
    
    @Column(name = "documents_folder_link", columnDefinition = "TEXT")
    private String documentsFolderLink;
    
    @Column(name = "photo_id_proof_url", columnDefinition = "TEXT")
    private String photoIdProofUrl;
    
    @ElementCollection
    @CollectionTable(name = "customer_id_proof_urls", joinColumns = @JoinColumn(name = "customer_phone_number"))
    @Column(name = "id_proof_url", columnDefinition = "TEXT")
    private List<String> idProofUrls;
    
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

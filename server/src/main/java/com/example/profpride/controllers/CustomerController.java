package com.example.profpride.controllers;

import com.example.profpride.models.Booking;
import com.example.profpride.models.Customer;
import com.example.profpride.services.CustomerService;
import com.example.profpride.services.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/v1/customer")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CloudinaryService cloudinaryService;

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        try {
            List<Customer> customers = customerService.getAllCustomers();
            return ResponseEntity.ok(customers);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{phoneNumber}")
    public ResponseEntity<Customer> getCustomerByPhoneNumber(@PathVariable String phoneNumber) {
        try {
            Optional<Customer> customer = customerService.getCustomerByPhoneNumber(phoneNumber);
            if (customer.isPresent()) {
                return ResponseEntity.ok(customer.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getCustomerBookings(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().build();
            }

            String token = authHeader.substring(7);
            
            // Extract phone number from token (simple implementation)
            if (!token.startsWith("customer_token_")) {
                return ResponseEntity.badRequest().build();
            }

            String[] tokenParts = token.split("_");
            if (tokenParts.length < 3) {
                return ResponseEntity.badRequest().build();
            }

            String phoneNumber = tokenParts[2];
            
            // Find customer
            Optional<Customer> customerOpt = customerService.getCustomerByPhoneNumber(phoneNumber);
            if (!customerOpt.isPresent()) {
                return ResponseEntity.badRequest().build();
            }

            // Get bookings for this customer
            List<Booking> bookings = customerService.getCustomerBookings(phoneNumber);
            
            return ResponseEntity.ok(bookings);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getCustomerProfile(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.put("success", false);
                response.put("message", "Invalid authorization header");
                return ResponseEntity.badRequest().body(response);
            }

            String token = authHeader.substring(7);
            
            // Extract phone number from token
            if (!token.startsWith("customer_token_")) {
                response.put("success", false);
                response.put("message", "Invalid token");
                return ResponseEntity.badRequest().body(response);
            }

            String[] tokenParts = token.split("_");
            if (tokenParts.length < 3) {
                response.put("success", false);
                response.put("message", "Invalid token format");
                return ResponseEntity.badRequest().body(response);
            }

            String phoneNumber = tokenParts[2];
            
            // Find customer
            Optional<Customer> customerOpt = customerService.getCustomerByPhoneNumber(phoneNumber);
            if (!customerOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Customer not found");
                return ResponseEntity.badRequest().body(response);
            }

            Customer customer = customerOpt.get();
            
            response.put("success", true);
            response.put("customer", Map.of(
                "phoneNumber", customer.getPhoneNumber(),
                "name", customer.getName(),
                "additionalPhoneNumber", customer.getAdditionalPhoneNumber() != null ? customer.getAdditionalPhoneNumber() : "",
                "remarks", customer.getRemarks() != null ? customer.getRemarks() : ""
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to get customer profile: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateCustomerProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.put("success", false);
                response.put("message", "Invalid authorization header");
                return ResponseEntity.badRequest().body(response);
            }

            String token = authHeader.substring(7);
            
            // Extract phone number from token
            if (!token.startsWith("customer_token_")) {
                response.put("success", false);
                response.put("message", "Invalid token");
                return ResponseEntity.badRequest().body(response);
            }

            String[] tokenParts = token.split("_");
            if (tokenParts.length < 3) {
                response.put("success", false);
                response.put("message", "Invalid token format");
                return ResponseEntity.badRequest().body(response);
            }

            String phoneNumber = tokenParts[2];
            
            // Find customer
            Optional<Customer> customerOpt = customerService.getCustomerByPhoneNumber(phoneNumber);
            if (!customerOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Customer not found");
                return ResponseEntity.badRequest().body(response);
            }

            // Update customer profile
            Customer updatedCustomer = customerService.updateCustomerProfile(phoneNumber, request);
            
            response.put("success", true);
            response.put("message", "Profile updated successfully");
            response.put("customer", Map.of(
                "phoneNumber", updatedCustomer.getPhoneNumber(),
                "name", updatedCustomer.getName(),
                "additionalPhoneNumber", updatedCustomer.getAdditionalPhoneNumber() != null ? updatedCustomer.getAdditionalPhoneNumber() : "",
                "remarks", updatedCustomer.getRemarks() != null ? updatedCustomer.getRemarks() : ""
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to update profile: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/{phoneNumber}/upload-photo-id")
    public ResponseEntity<String> uploadPhotoIdProof(
            @PathVariable String phoneNumber,
            @RequestParam("file") MultipartFile file) {
        try {
            String photoIdUrl = cloudinaryService.uploadPhotoIdProof(file, phoneNumber);
            
            // Update customer record with photo ID URL and mark ID proof as submitted
            customerService.updateCustomerPhotoIdUrl(phoneNumber, photoIdUrl);
            customerService.updateCustomerIdProofSubmitted(phoneNumber, true);
            
            return ResponseEntity.ok(photoIdUrl);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to upload photo ID proof: " + e.getMessage());
        }
    }

    @PostMapping("/{phoneNumber}/upload-id-proofs")
    public ResponseEntity<Map<String, Object>> uploadMultipleIdProofs(
            @PathVariable String phoneNumber,
            @RequestParam("files") MultipartFile[] files) {
        try {
            List<String> uploadedUrls = new ArrayList<>();
            
            // Upload each file
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String photoIdUrl = cloudinaryService.uploadPhotoIdProof(file, phoneNumber);
                    uploadedUrls.add(photoIdUrl);
                }
            }
            
            // Update customer record with new ID proof URLs
            Optional<Customer> customerOpt = customerService.getCustomerByPhoneNumber(phoneNumber);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                
                // Initialize the list if it's null
                if (customer.getIdProofUrls() == null) {
                    customer.setIdProofUrls(new ArrayList<>());
                }
                
                // Add new URLs to existing ones
                customer.getIdProofUrls().addAll(uploadedUrls);
                customerService.updateCustomerIdProofUrls(phoneNumber, customer.getIdProofUrls());
                
                // Mark ID proof as submitted
                customerService.updateCustomerIdProofSubmitted(phoneNumber, true);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("uploadedUrls", uploadedUrls);
            response.put("message", "Successfully uploaded " + uploadedUrls.size() + " ID proof(s)");
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to upload ID proofs: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/{phoneNumber}/id-proofs/{index}")
    public ResponseEntity<Map<String, Object>> deleteIdProof(
            @PathVariable String phoneNumber,
            @PathVariable int index) {
        try {
            Optional<Customer> customerOpt = customerService.getCustomerByPhoneNumber(phoneNumber);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                
                if (customer.getIdProofUrls() != null && index >= 0 && index < customer.getIdProofUrls().size()) {
                    String removedUrl = customer.getIdProofUrls().remove(index);
                    customerService.updateCustomerIdProofUrls(phoneNumber, customer.getIdProofUrls());
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    response.put("message", "ID proof deleted successfully");
                    response.put("removedUrl", removedUrl);
                    
                    return ResponseEntity.ok(response);
                } else {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "Invalid index or no ID proofs found");
                    return ResponseEntity.badRequest().body(response);
                }
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Customer not found");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to delete ID proof: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{phoneNumber}")
    public ResponseEntity<Map<String, Object>> updateCustomer(
            @PathVariable String phoneNumber,
            @RequestBody Customer updatedCustomer) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (!customerService.customerExists(phoneNumber)) {
                response.put("success", false);
                response.put("message", "Customer not found");
                return ResponseEntity.status(404).body(response);
            }

            // Update customer
            Customer savedCustomer = customerService.updateCustomer(phoneNumber, updatedCustomer);
            
            response.put("success", true);
            response.put("message", "Customer updated successfully");
            response.put("customer", Map.of(
                "phoneNumber", savedCustomer.getPhoneNumber(),
                "name", savedCustomer.getName(),
                "additionalPhoneNumber", savedCustomer.getAdditionalPhoneNumber() != null ? savedCustomer.getAdditionalPhoneNumber() : "",
                "remarks", savedCustomer.getRemarks() != null ? savedCustomer.getRemarks() : ""
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to update customer: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/{phoneNumber}")
    public ResponseEntity<Map<String, Object>> deleteCustomer(@PathVariable String phoneNumber) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (customerService.customerExists(phoneNumber)) {
                customerService.deleteCustomer(phoneNumber);
                response.put("success", true);
                response.put("message", "Customer deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Customer not found");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to delete customer: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

}

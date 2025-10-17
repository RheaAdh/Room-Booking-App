package com.example.profpride.controllers;

import com.example.profpride.models.Customer;
import com.example.profpride.services.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth/customer")
public class CustomerAuthController {

    @Autowired
    private CustomerService customerService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerCustomer(@RequestBody Customer customer) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Check if customer already exists
            if (customerService.customerExists(customer.getPhoneNumber())) {
                response.put("success", false);
                response.put("message", "Customer with this phone number already exists");
                return ResponseEntity.badRequest().body(response);
            }

            // Create new customer
            Customer savedCustomer = customerService.createCustomer(customer);
            
            response.put("success", true);
            response.put("message", "Customer registered successfully");
            response.put("customer", Map.of(
                "phoneNumber", savedCustomer.getPhoneNumber(),
                "name", savedCustomer.getName()
            ));
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> loginCustomer(@RequestBody Map<String, String> loginRequest) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String phoneNumber = loginRequest.get("phoneNumber");
            String password = loginRequest.get("password");
            
            if (phoneNumber == null || password == null) {
                response.put("success", false);
                response.put("message", "Phone number and password are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Validate credentials
            if (customerService.validateCustomerCredentials(phoneNumber, password)) {
                // Generate simple token (in production, use JWT)
                String token = "customer_token_" + phoneNumber + "_" + System.currentTimeMillis();
                
                Optional<Customer> customerOpt = customerService.getCustomerByPhoneNumber(phoneNumber);
                if (customerOpt.isPresent()) {
                    Customer customer = customerOpt.get();
                    
                    response.put("success", true);
                    response.put("message", "Login successful");
                    response.put("token", token);
                    response.put("customer", Map.of(
                        "phoneNumber", customer.getPhoneNumber(),
                        "name", customer.getName()
                    ));
                    
                    return ResponseEntity.ok(response);
                }
            }
            
            response.put("success", false);
            response.put("message", "Invalid phone number or password");
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logoutCustomer(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // In a real application, you would invalidate the token here
            // For now, we'll just return success
            
            response.put("success", true);
            response.put("message", "Logout successful");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Logout failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
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
}

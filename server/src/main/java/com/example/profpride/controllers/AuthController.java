package com.example.profpride.controllers;

import com.example.profpride.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = loginRequest.get("userId");
            String password = loginRequest.get("password");
            
            if (userId == null || password == null) {
                response.put("success", false);
                response.put("message", "User ID and password are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Query the users table to validate credentials
            String sql = "SELECT userid, password, role, name FROM users WHERE userid = ?";
            
            try {
                Map<String, Object> user = jdbcTemplate.queryForMap(sql, userId);
                
                // Check if password matches
                if (password.equals(user.get("password"))) {
                    // Generate JWT token
                    String token = jwtUtils.generateToken(
                        user.get("userid").toString(),
                        user.get("role").toString(),
                        user.get("name").toString()
                    );
                    
                    response.put("success", true);
                    response.put("message", "Login successful");
                    response.put("token", token);
                    response.put("user", Map.of(
                        "userId", user.get("userid"),
                        "name", user.get("name"),
                        "role", user.get("role")
                    ));
                    
                    return ResponseEntity.ok(response);
                } else {
                    response.put("success", false);
                    response.put("message", "Invalid credentials");
                    return ResponseEntity.badRequest().body(response);
                }
                
            } catch (Exception e) {
                // User not found
                response.put("success", false);
                response.put("message", "Invalid credentials");
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestHeader("Authorization") String authHeader) {
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
}

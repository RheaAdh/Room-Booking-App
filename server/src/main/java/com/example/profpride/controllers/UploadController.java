package com.example.profpride.controllers;

import com.example.profpride.services.CloudinaryService;
import com.example.profpride.services.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/upload")
public class UploadController {

    @Autowired
    private CloudinaryService cloudinaryService;
    
    @Autowired
    private CustomerService customerService;

    @PostMapping("/photo-id-proof")
    public ResponseEntity<Map<String, Object>> uploadPhotoIdProof(
            @RequestParam("file") MultipartFile file,
            @RequestParam("phoneNumber") String phoneNumber) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "No file provided");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file size (10MB limit)
            if (file.getSize() > 10 * 1024 * 1024) {
                response.put("success", false);
                response.put("message", "File size too large. Maximum size is 10MB");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
                response.put("success", false);
                response.put("message", "Invalid file type. Only images and PDF files are allowed");
                return ResponseEntity.badRequest().body(response);
            }

                  String photoIdUrl = cloudinaryService.uploadPhotoIdProof(file, phoneNumber);
            
            // Update customer's ID proof submitted status
            try {
                customerService.updateCustomerIdProofSubmitted(phoneNumber, true);
            } catch (Exception e) {
                // Log the error but don't fail the upload
                System.err.println("Failed to update customer ID proof status: " + e.getMessage());
            }
            
            response.put("success", true);
            response.put("url", photoIdUrl);
            response.put("message", "Photo ID proof uploaded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Failed to upload photo ID proof: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/multiple-id-proofs")
    public ResponseEntity<Map<String, Object>> uploadMultipleIdProofs(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("phoneNumber") String phoneNumber) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (files == null || files.length == 0) {
                response.put("success", false);
                response.put("message", "No files provided");
                return ResponseEntity.badRequest().body(response);
            }

                  List<String> uploadedUrls = cloudinaryService.uploadMultipleFiles(files, phoneNumber);
            
            // Update customer's ID proof submitted status
            try {
                customerService.updateCustomerIdProofSubmitted(phoneNumber, true);
            } catch (Exception e) {
                // Log the error but don't fail the upload
                System.err.println("Failed to update customer ID proof status: " + e.getMessage());
            }
            
            response.put("success", true);
            response.put("uploadedUrls", uploadedUrls);
            response.put("message", "Successfully uploaded " + uploadedUrls.size() + " ID proof(s)");
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Failed to upload ID proofs: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/payment-screenshot")
    public ResponseEntity<Map<String, Object>> uploadPaymentScreenshot(
            @RequestParam("file") MultipartFile file,
            @RequestParam("phoneNumber") String phoneNumber) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "No file provided");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file size (10MB limit)
            if (file.getSize() > 10 * 1024 * 1024) {
                response.put("success", false);
                response.put("message", "File size too large. Maximum size is 10MB");
                return ResponseEntity.badRequest().body(response);
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.put("success", false);
                response.put("message", "Invalid file type. Only image files are allowed");
                return ResponseEntity.badRequest().body(response);
            }

                  String paymentScreenshotUrl = cloudinaryService.uploadPaymentScreenshot(file, phoneNumber);
            
            response.put("success", true);
            response.put("url", paymentScreenshotUrl);
            response.put("message", "Payment screenshot uploaded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Failed to upload payment screenshot: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/test-connectivity")
    public ResponseEntity<Map<String, Object>> testConnectivity() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Test if Cloudinary is working
            boolean isConnected = cloudinaryService.testConnection();
            
            if (isConnected) {
                response.put("success", true);
                response.put("message", "Cloudinary connectivity test successful");
            } else {
                response.put("success", false);
                response.put("message", "Cloudinary connectivity test failed");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
                response.put("message", "Cloudinary connectivity test failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/test-simple")
    public ResponseEntity<Map<String, Object>> testSimple() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Simple test endpoint working");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-upload")
    public ResponseEntity<Map<String, Object>> testUpload(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String url = cloudinaryService.uploadPhotoIdProof(file, "test-phone");
            response.put("success", true);
            response.put("message", "Upload successful");
            response.put("url", url);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Upload failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}

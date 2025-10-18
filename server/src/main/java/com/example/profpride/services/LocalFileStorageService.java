package com.example.profpride.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class LocalFileStorageService {

    @Value("${file.upload.path:uploads}")
    private String uploadPath;

    public String uploadPhotoIdProof(MultipartFile file, String phoneNumber) throws IOException {
        return uploadFile(file, phoneNumber, "idproofs");
    }

    public List<String> uploadMultipleFiles(MultipartFile[] files, String phoneNumber) throws IOException {
        List<String> uploadedUrls = new ArrayList<>();
        
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String url = uploadPhotoIdProof(file, phoneNumber);
                uploadedUrls.add(url);
            }
        }
        
        return uploadedUrls;
    }

    public String uploadPaymentScreenshot(MultipartFile file, String phoneNumber) throws IOException {
        return uploadFile(file, phoneNumber, "payments");
    }

    private String uploadFile(MultipartFile file, String phoneNumber, String subfolder) throws IOException {
        // Create directory structure: uploads/{phoneNumber}/{subfolder}/
        Path phoneDir = Paths.get(uploadPath, phoneNumber, subfolder);
        Files.createDirectories(phoneDir);
        
        // Generate unique filename with timestamp
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = timestamp + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
        
        // Save file
        Path filePath = phoneDir.resolve(filename);
        Files.copy(file.getInputStream(), filePath);
        
        // Return relative URL path
        return "/uploads/" + phoneNumber + "/" + subfolder + "/" + filename;
    }

    public boolean testConnection() {
        try {
            Path uploadDir = Paths.get(uploadPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

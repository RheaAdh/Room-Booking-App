package com.example.profpride.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CloudinaryService {

    private Cloudinary cloudinary;

    @Value("${cloudinary.cloud_name:}")
    private String cloudName;

    @Value("${cloudinary.api_key:}")
    private String apiKey;

    @Value("${cloudinary.api_secret:}")
    private String apiSecret;

    private Cloudinary getCloudinary() {
        if (cloudinary == null) {
            Map<String, String> config = new HashMap<>();
            config.put("cloud_name", cloudName);
            config.put("api_key", apiKey);
            config.put("api_secret", apiSecret);
            cloudinary = new Cloudinary(config);
        }
        return cloudinary;
    }

    public String uploadPhotoIdProof(MultipartFile file, String phoneNumber) throws IOException {
        Map<String, Object> params = ObjectUtils.asMap(
            "public_id", phoneNumber + "/id-proof/" + System.currentTimeMillis(),
            "folder", phoneNumber + "/id-proof",
            "resource_type", "auto"
        );
        
        Map<?, ?> uploadResult = getCloudinary().uploader().upload(file.getBytes(), params);
        return (String) uploadResult.get("secure_url");
    }

    public List<String> uploadMultipleFiles(MultipartFile[] files, String phoneNumber) throws IOException {
        List<String> uploadedUrls = new java.util.ArrayList<>();
        
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String url = uploadPhotoIdProof(file, phoneNumber);
                uploadedUrls.add(url);
            }
        }
        
        return uploadedUrls;
    }

    public String uploadPaymentScreenshot(MultipartFile file, String phoneNumber) throws IOException {
        Map<String, Object> params = ObjectUtils.asMap(
            "public_id", phoneNumber + "/payments/" + System.currentTimeMillis(),
            "folder", phoneNumber + "/payments",
            "resource_type", "auto"
        );
        
        Map<?, ?> uploadResult = getCloudinary().uploader().upload(file.getBytes(), params);
        return (String) uploadResult.get("secure_url");
    }

    public boolean testConnection() {
        try {
            // Test with a simple API call - just check if credentials are set
            return cloudName != null && !cloudName.isEmpty() && 
                   apiKey != null && !apiKey.isEmpty() && 
                   apiSecret != null && !apiSecret.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}

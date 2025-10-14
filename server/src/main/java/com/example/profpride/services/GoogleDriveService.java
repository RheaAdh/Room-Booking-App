package com.example.profpride.services;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@Service
public class GoogleDriveService {

    public String uploadPhotoIdProof(MultipartFile file, String phoneNumber) throws IOException {
        // TODO: Implement Google Drive upload functionality
        // For now, return a placeholder URL
        return "https://drive.google.com/file/placeholder_" + phoneNumber + "_" + System.currentTimeMillis();
    }

    public List<String> uploadMultipleFiles(MultipartFile[] files, String phoneNumber) throws IOException {
        // TODO: Implement multiple file upload
        return List.of("https://drive.google.com/file/placeholder_" + phoneNumber);
    }
}

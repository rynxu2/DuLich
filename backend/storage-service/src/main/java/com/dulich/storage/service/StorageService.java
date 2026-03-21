package com.dulich.storage.service;

import com.dulich.storage.dto.FileResponse;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Storage Service — Upload, download, delete files via MinIO (S3-compatible).
 *
 * File paths: {entityType}/{entityId}/{uuid}_{originalFilename}
 * Example:    tour/123/a1b2c3d4_beach.jpg
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.endpoint}")
    private String minioEndpoint;

    /**
     * Upload file to MinIO.
     * @param file        multipart file
     * @param entityType  e.g., "tour", "user", "expense", "guide"
     * @param entityId    the entity's ID
     * @return file metadata response
     */
    public FileResponse upload(MultipartFile file, String entityType, Long entityId) {
        try {
            String originalName = file.getOriginalFilename();
            String fileId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            String objectName = String.format("%s/%d/%s_%s",
                    entityType, entityId, fileId, originalName);

            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());

            String publicUrl = String.format("%s/%s/%s", minioEndpoint, bucketName, objectName);

            log.info("Uploaded file: {} ({} bytes) -> {}", originalName, file.getSize(), objectName);

            return FileResponse.builder()
                    .fileId(fileId)
                    .fileName(originalName)
                    .contentType(file.getContentType())
                    .size(file.getSize())
                    .url(publicUrl)
                    .entityType(entityType)
                    .entityId(entityId)
                    .build();

        } catch (Exception e) {
            log.error("Failed to upload file: {}", e.getMessage());
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    /**
     * Get a pre-signed URL (temporary access, 1 hour).
     */
    public String getSignedUrl(String objectName) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(1, TimeUnit.HOURS)
                            .build());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate signed URL: " + e.getMessage());
        }
    }

    /**
     * Download file as InputStream.
     */
    public InputStream download(String objectName) {
        try {
            return minioClient.getObject(GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build());
        } catch (Exception e) {
            throw new RuntimeException("File download failed: " + e.getMessage());
        }
    }

    /**
     * Delete file from MinIO.
     */
    public void delete(String objectName) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build());
            log.info("Deleted file: {}", objectName);
        } catch (Exception e) {
            throw new RuntimeException("File delete failed: " + e.getMessage());
        }
    }
}

package com.dulich.platform.service;

import com.dulich.platform.dto.FileResponse;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.endpoint}")
    private String minioEndpoint;

    public FileResponse upload(MultipartFile file, String entityType, Long entityId) {
        try {
            String originalName = file.getOriginalFilename();
            String fileId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            String objectName = String.format("%s/%d/%s_%s", entityType, entityId, fileId, originalName);

            minioClient.putObject(PutObjectArgs.builder()
                .bucket(bucketName).object(objectName)
                .stream(file.getInputStream(), file.getSize(), -1)
                .contentType(file.getContentType()).build());

            String publicUrl = String.format("%s/%s/%s", minioEndpoint, bucketName, objectName);
            log.info("Uploaded: {} ({} bytes)", originalName, file.getSize());

            return FileResponse.builder()
                .fileId(fileId).fileName(originalName).contentType(file.getContentType())
                .size(file.getSize()).url(publicUrl).entityType(entityType).entityId(entityId).build();
        } catch (Exception e) {
            throw new RuntimeException("Upload failed: " + e.getMessage());
        }
    }

    public String getSignedUrl(String objectName) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .method(Method.GET).bucket(bucketName).object(objectName)
                .expiry(1, TimeUnit.HOURS).build());
        } catch (Exception e) { throw new RuntimeException("Signed URL failed: " + e.getMessage()); }
    }

    public InputStream download(String objectName) {
        try {
            return minioClient.getObject(GetObjectArgs.builder().bucket(bucketName).object(objectName).build());
        } catch (Exception e) { throw new RuntimeException("Download failed: " + e.getMessage()); }
    }

    public void delete(String objectName) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucketName).object(objectName).build());
            log.info("Deleted: {}", objectName);
        } catch (Exception e) { throw new RuntimeException("Delete failed: " + e.getMessage()); }
    }
}

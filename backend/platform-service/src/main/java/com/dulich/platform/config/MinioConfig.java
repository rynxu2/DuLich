package com.dulich.platform.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.SetBucketPolicyArgs;
import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MinioConfig {

    @Value("${minio.endpoint}") private String endpoint;
    @Value("${minio.access-key}") private String accessKey;
    @Value("${minio.secret-key}") private String secretKey;
    @Value("${minio.bucket-name}") private String bucketName;

    @Bean
    public MinioClient minioClient() {
        MinioClient client = MinioClient.builder()
            .endpoint(endpoint).credentials(accessKey, secretKey).build();
        try {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("Created MinIO bucket: {}", bucketName);
            }
            
            // Set bucket policy to allow public read access for files
            String policy = "{\n" +
                "  \"Version\": \"2012-10-17\",\n" +
                "  \"Statement\": [\n" +
                "    {\n" +
                "      \"Effect\": \"Allow\",\n" +
                "      \"Principal\": \"*\",\n" +
                "      \"Action\": [\"s3:GetObject\"],\n" +
                "      \"Resource\": [\"arn:aws:s3:::" + bucketName + "/*\"]\n" +
                "    }\n" +
                "  ]\n" +
                "}";
            
            client.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucketName).config(policy).build());
            log.info("Set public read policy on bucket: {}", bucketName);
        } catch (Exception e) {
            log.warn("MinIO bucket init/policy failed (may not be running): {}", e.getMessage());
        }
        return client;
    }
}

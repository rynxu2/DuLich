package com.dulich.platform.controller;

import com.dulich.platform.dto.FileResponse;
import com.dulich.platform.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.util.Map;

@RestController
@RequestMapping("/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;

    @PostMapping("/upload")
    public ResponseEntity<FileResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "general") String entityType,
            @RequestParam(defaultValue = "0") Long entityId) {
        return ResponseEntity.ok(storageService.upload(file, entityType, entityId));
    }

    @GetMapping("/signed-url")
    public ResponseEntity<Map<String, String>> getSignedUrl(@RequestParam String objectName) {
        return ResponseEntity.ok(Map.of("url", storageService.getSignedUrl(objectName)));
    }

    @GetMapping("/download")
    public ResponseEntity<InputStreamResource> download(@RequestParam String objectName) {
        InputStream stream = storageService.download(objectName);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + objectName + "\"")
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(new InputStreamResource(stream));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@RequestParam String objectName) {
        storageService.delete(objectName);
        return ResponseEntity.noContent().build();
    }
}

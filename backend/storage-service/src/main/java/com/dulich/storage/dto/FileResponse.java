package com.dulich.storage.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FileResponse {
    private String fileId;
    private String fileName;
    private String contentType;
    private long size;
    private String url;
    private String entityType;
    private Long entityId;
}

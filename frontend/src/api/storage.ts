/**
 * Storage API — Storage Service endpoints (port 8098)
 *
 * POST   /storage/upload      — Upload file (multipart)
 * GET    /storage/signed-url   — Get pre-signed URL for temp access
 * GET    /storage/download     — Direct download
 * DELETE /storage              — Delete file
 */
import apiClient from './client';

export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  objectName: string;
}

export const storageApi = {
  /**
   * Upload a file — uses multipart/form-data
   * @param file      File object or { uri, name, type } for React Native
   * @param entityType e.g. 'tour', 'expense', 'user'
   * @param entityId   ID of the entity
   */
  upload: (file: any, entityType: string, entityId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    return apiClient.post<FileUploadResponse>('/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Get temporary pre-signed URL for a file */
  getSignedUrl: (objectName: string) =>
    apiClient.get<string>('/storage/signed-url', {
      params: { objectName },
    }),

  /** Delete a file */
  delete: (objectName: string) =>
    apiClient.delete('/storage', {
      params: { objectName },
    }),
};

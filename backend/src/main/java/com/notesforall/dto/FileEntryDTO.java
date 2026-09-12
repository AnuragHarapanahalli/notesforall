package com.notesforall.dto;

import com.notesforall.model.FolderType;
import java.time.LocalDateTime;

public class FileEntryDTO {
    private Long id;
    private Long subjectId;
    private FolderType folderType;
    private String originalFileName;
    private String fileType;
    private Long fileSize;
    private LocalDateTime uploadedAt;

    public FileEntryDTO() {}

    public FileEntryDTO(Long id, Long subjectId, FolderType folderType, String originalFileName, String fileType, Long fileSize, LocalDateTime uploadedAt) {
        this.id = id;
        this.subjectId = subjectId;
        this.folderType = folderType;
        this.originalFileName = originalFileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.uploadedAt = uploadedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public FolderType getFolderType() {
        return folderType;
    }

    public void setFolderType(FolderType folderType) {
        this.folderType = folderType;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}

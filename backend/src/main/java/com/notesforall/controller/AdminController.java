package com.notesforall.controller;

import com.notesforall.dto.FileEntryDTO;
import com.notesforall.dto.SubjectDTO;
import com.notesforall.model.FolderType;
import com.notesforall.model.Subject;
import com.notesforall.service.FileService;
import com.notesforall.service.SubjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Admin-only endpoints — all routes require JWT authentication.
 * Protected by SecurityConfig which requires authentication for /api/admin/**
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final SubjectService subjectService;
    private final FileService fileService;

    public AdminController(SubjectService subjectService, FileService fileService) {
        this.subjectService = subjectService;
        this.fileService = fileService;
    }

    // ─── Subject Management ───────────────────────────────────────────────────

    /**
     * Create a new subject.
     * POST /api/admin/subjects
     * Body: { "name": "Data Structures", "code": "DS", "description": "..." }
     */
    @PostMapping("/subjects")
    public ResponseEntity<SubjectDTO> createSubject(@RequestBody Subject subject) {
        Subject created = subjectService.createSubject(subject);
        return ResponseEntity.ok(subjectService.getSubject(created.getId()));
    }

    /**
     * Update an existing subject.
     * PUT /api/admin/subjects/{id}
     */
    @PutMapping("/subjects/{id}")
    public ResponseEntity<SubjectDTO> updateSubject(@PathVariable Long id, @RequestBody Subject subject) {
        Subject updated = subjectService.updateSubject(id, subject);
        return ResponseEntity.ok(subjectService.getSubject(updated.getId()));
    }

    /**
     * Dedicated endpoint to update/toggle subject status.
     * PUT /api/admin/subjects/{id}/status
     */
    @PutMapping("/subjects/{id}/status")
    public ResponseEntity<SubjectDTO> updateSubjectStatus(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "true") boolean isLive) {
        Subject updated = subjectService.updateSubjectStatus(id, isLive);
        return ResponseEntity.ok(subjectService.getSubject(updated.getId()));
    }

    /**
     * Delete a subject and all its files.
     * DELETE /api/admin/subjects/{id}
     */
    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.noContent().build();
    }

    // ─── File Management ──────────────────────────────────────────────────────

    /**
     * Upload a file to a specific subject folder.
     * POST /api/admin/subjects/{subjectId}/folders/{folderType}/upload
     * Form-data: file (MultipartFile)
     * folderType must be one of: NOTES, PYQS, PPTS
     */
    @PostMapping("/subjects/{subjectId}/folders/{folderType}/upload")
    public ResponseEntity<FileEntryDTO> uploadFile(
            @PathVariable Long subjectId,
            @PathVariable FolderType folderType,
            @RequestParam("file") MultipartFile file) throws IOException {
        FileEntryDTO dto = fileService.uploadFile(subjectId, folderType, file);
        return ResponseEntity.ok(dto);
    }

    /**
     * Delete a file by its ID.
     * DELETE /api/admin/files/{fileId}
     */
    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long fileId) throws IOException {
        fileService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }
}

package com.notesforall.controller;

import com.notesforall.dto.SubmissionDTO;
import com.notesforall.model.FolderType;
import com.notesforall.model.Submission;
import com.notesforall.model.SubmissionStatus;
import com.notesforall.service.SubmissionService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    /**
     * Student Material Contribution (public).
     * POST /api/submissions
     */
    @PostMapping(value = "/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SubmissionDTO> submitMaterial(
            @RequestParam("subjectId") Long subjectId,
            @RequestParam("folderType") FolderType folderType,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "contributorName", required = false) String contributorName,
            @RequestParam(value = "contributorEmail", required = false) String contributorEmail,
            @RequestParam("file") MultipartFile file) throws IOException {

        SubmissionDTO created = submissionService.createSubmission(
                subjectId, folderType, title, contributorName, contributorEmail, file);
        return ResponseEntity.ok(created);
    }

    /**
     * Admin: List all submissions or filter by status.
     * GET /api/admin/submissions?status=PENDING
     */
    @GetMapping("/admin/submissions")
    public ResponseEntity<List<SubmissionDTO>> listSubmissions(
            @RequestParam(value = "status", required = false) SubmissionStatus status) {
        return ResponseEntity.ok(submissionService.listSubmissions(status));
    }

    /**
     * Admin: Count of pending submissions for badge.
     * GET /api/admin/submissions/pending-count
     */
    @GetMapping("/admin/submissions/pending-count")
    public ResponseEntity<Map<String, Long>> getPendingCount() {
        return ResponseEntity.ok(Map.of("count", submissionService.countPending()));
    }

    /**
     * Admin: Approve submission and publish to subject folder.
     * POST /api/admin/submissions/{id}/approve
     */
    @PostMapping("/admin/submissions/{id}/approve")
    public ResponseEntity<SubmissionDTO> approveSubmission(@PathVariable Long id) throws IOException {
        return ResponseEntity.ok(submissionService.approveSubmission(id));
    }

    /**
     * Admin: Reject submission.
     * POST /api/admin/submissions/{id}/reject
     */
    @PostMapping("/admin/submissions/{id}/reject")
    public ResponseEntity<SubmissionDTO> rejectSubmission(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(submissionService.rejectSubmission(id, reason));
    }

    /**
     * Admin: Preview submitted file (inline reader).
     * GET /api/admin/submissions/{id}/preview
     */
    @GetMapping("/admin/submissions/{id}/preview")
    public ResponseEntity<Resource> previewSubmission(@PathVariable Long id) throws IOException {
        Resource resource = submissionService.loadSubmissionResource(id);
        Submission sub = submissionService.getSubmission(id);
        MediaType mediaType = resolveMediaType(sub);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + sub.getOriginalFileName() + "\"")
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .contentLength(resource.contentLength())
                .contentType(mediaType)
                .body(resource);
    }

    private MediaType resolveMediaType(Submission sub) {
        String name = sub.getOriginalFileName() != null ? sub.getOriginalFileName().toLowerCase() : "";
        String stored = sub.getFileType() != null ? sub.getFileType().toLowerCase() : "";

        if (name.endsWith(".pdf") || stored.contains("pdf")) {
            return MediaType.APPLICATION_PDF;
        } else if (name.endsWith(".md") || name.endsWith(".markdown") || stored.contains("markdown") || stored.contains("text/plain")) {
            return MediaType.TEXT_PLAIN;
        } else if (name.endsWith(".txt")) {
            return MediaType.TEXT_PLAIN;
        } else if (name.endsWith(".docx") || stored.contains("wordprocessingml")) {
            return MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        } else if (name.endsWith(".doc") || stored.contains("msword")) {
            return MediaType.parseMediaType("application/msword");
        } else if (name.endsWith(".pptx") || stored.contains("presentationml")) {
            return MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.presentationml.presentation");
        } else if (name.endsWith(".ppt") || stored.contains("powerpoint")) {
            return MediaType.parseMediaType("application/vnd.ms-powerpoint");
        } else if (name.endsWith(".html") || stored.contains("html")) {
            return MediaType.TEXT_HTML;
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}

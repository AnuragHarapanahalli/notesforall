package com.notesforall.service;

import com.notesforall.dto.SubmissionDTO;
import com.notesforall.model.*;
import com.notesforall.repository.FileEntryRepository;
import com.notesforall.repository.SubmissionRepository;
import com.notesforall.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final SubjectRepository subjectRepository;
    private final FileEntryRepository fileEntryRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public SubmissionService(SubmissionRepository submissionRepository,
                             SubjectRepository subjectRepository,
                             FileEntryRepository fileEntryRepository) {
        this.submissionRepository = submissionRepository;
        this.subjectRepository = subjectRepository;
        this.fileEntryRepository = fileEntryRepository;
    }

    /**
     * Submit material from a student (public).
     */
    public SubmissionDTO createSubmission(Long subjectId,
                                         FolderType folderType,
                                         String title,
                                         String contributorName,
                                         String contributorEmail,
                                         MultipartFile file) throws IOException {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + subjectId));

        Path subDir = Paths.get(uploadDir, "submissions");
        Files.createDirectories(subDir);

        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String storedFileName = UUID.randomUUID() + extension;

        Path targetPath = subDir.resolve(storedFileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        Submission sub = new Submission();
        sub.setSubject(subject);
        sub.setFolderType(folderType);
        sub.setTitle(title != null && !title.isBlank() ? title : (originalFileName != null ? originalFileName : "Document"));
        sub.setContributorName(contributorName != null && !contributorName.isBlank() ? contributorName.trim() : "Anonymous Student");
        sub.setContributorEmail(contributorEmail != null ? contributorEmail.trim() : null);
        sub.setOriginalFileName(originalFileName != null ? originalFileName : "document");
        sub.setStoredFileName(storedFileName);
        sub.setFileType(file.getContentType());
        sub.setFileSize(file.getSize());
        sub.setStatus(SubmissionStatus.PENDING);

        Submission saved = submissionRepository.save(sub);
        return toDTO(saved);
    }

    /**
     * List all submissions or filter by status.
     */
    public List<SubmissionDTO> listSubmissions(SubmissionStatus status) {
        List<Submission> list = (status == null)
                ? submissionRepository.findAllByOrderBySubmittedAtDesc()
                : submissionRepository.findByStatusOrderBySubmittedAtDesc(status);
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Count pending submissions for dashboard badge.
     */
    public long countPending() {
        return submissionRepository.countByStatus(SubmissionStatus.PENDING);
    }

    /**
     * Approve submission — moves/copies file into subject repository and publishes as FileEntry.
     */
    @Transactional
    public SubmissionDTO approveSubmission(Long submissionId) throws IOException {
        Submission sub = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

        if (sub.getStatus() == SubmissionStatus.APPROVED) {
            return toDTO(sub);
        }

        Subject subject = sub.getSubject();
        FolderType folderType = sub.getFolderType();

        Path destDir = Paths.get(uploadDir, String.valueOf(subject.getId()), folderType.name());
        Files.createDirectories(destDir);

        Path sourceFile = Paths.get(uploadDir, "submissions", sub.getStoredFileName());
        Path destFile = destDir.resolve(sub.getStoredFileName());

        if (Files.exists(sourceFile)) {
            Files.copy(sourceFile, destFile, StandardCopyOption.REPLACE_EXISTING);
        } else {
            throw new IOException("Submission file not found on disk: " + sourceFile);
        }

        // Create official FileEntry
        FileEntry entry = new FileEntry();
        entry.setSubject(subject);
        entry.setFolderType(folderType);
        entry.setOriginalFileName(sub.getOriginalFileName());
        entry.setStoredFileName(sub.getStoredFileName());
        entry.setFileType(sub.getFileType());
        entry.setFileSize(sub.getFileSize());
        fileEntryRepository.save(entry);

        sub.setStatus(SubmissionStatus.APPROVED);
        sub.setReviewedAt(LocalDateTime.now());
        sub.setReviewNotes("Approved and published to " + subject.getName() + " (" + folderType.name() + ")");

        return toDTO(submissionRepository.save(sub));
    }

    /**
     * Reject submission.
     */
    @Transactional
    public SubmissionDTO rejectSubmission(Long submissionId, String reason) {
        Submission sub = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

        sub.setStatus(SubmissionStatus.REJECTED);
        sub.setReviewedAt(LocalDateTime.now());
        sub.setReviewNotes(reason != null && !reason.isBlank() ? reason : "Not accepted");

        // Clean up pending file
        try {
            Path file = Paths.get(uploadDir, "submissions", sub.getStoredFileName());
            Files.deleteIfExists(file);
        } catch (Exception ignored) {}

        return toDTO(submissionRepository.save(sub));
    }

    /**
     * Load submission file for admin review preview.
     */
    public Resource loadSubmissionResource(Long submissionId) {
        Submission sub = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

        try {
            Path path = Paths.get(uploadDir, "submissions", sub.getStoredFileName());
            if (!Files.exists(path)) {
                // Check if already approved and moved
                path = Paths.get(uploadDir, String.valueOf(sub.getSubject().getId()), sub.getFolderType().name(), sub.getStoredFileName());
            }
            Resource res = new UrlResource(path.toUri());
            if (res.exists() && res.isReadable()) {
                return res;
            }
            throw new RuntimeException("Could not read submission file: " + sub.getOriginalFileName());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Malformed path for submission: " + submissionId, e);
        }
    }

    public Submission getSubmission(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Submission not found: " + id));
    }

    private SubmissionDTO toDTO(Submission sub) {
        SubmissionDTO dto = new SubmissionDTO();
        dto.setId(sub.getId());
        dto.setSubjectId(sub.getSubject().getId());
        dto.setSubjectName(sub.getSubject().getName());
        dto.setSubjectCode(sub.getSubject().getCode());
        dto.setFolderType(sub.getFolderType());
        dto.setTitle(sub.getTitle());
        dto.setContributorName(sub.getContributorName());
        dto.setContributorEmail(sub.getContributorEmail());
        dto.setOriginalFileName(sub.getOriginalFileName());
        dto.setFileType(sub.getFileType());
        dto.setFileSize(sub.getFileSize());
        dto.setStatus(sub.getStatus());
        dto.setReviewNotes(sub.getReviewNotes());
        dto.setSubmittedAt(sub.getSubmittedAt());
        dto.setReviewedAt(sub.getReviewedAt());
        return dto;
    }
}

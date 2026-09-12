package com.notesforall.service;

import com.notesforall.dto.FileEntryDTO;
import com.notesforall.model.FileEntry;
import com.notesforall.model.FolderType;
import com.notesforall.model.Subject;
import com.notesforall.repository.FileEntryRepository;
import com.notesforall.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FileService {

    private final FileEntryRepository fileEntryRepository;
    private final SubjectRepository subjectRepository;
    private final PptxToPdfService pptxToPdfService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public FileService(FileEntryRepository fileEntryRepository,
                       SubjectRepository subjectRepository,
                       PptxToPdfService pptxToPdfService) {
        this.fileEntryRepository = fileEntryRepository;
        this.subjectRepository = subjectRepository;
        this.pptxToPdfService = pptxToPdfService;
    }

    /**
     * Upload a file for a given subject and folder type.
     */
    public FileEntryDTO uploadFile(Long subjectId, FolderType folderType, MultipartFile file) throws IOException {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + subjectId));

        // Build directory path: uploads/{subjectId}/{FOLDERTYPE}/
        Path dirPath = Paths.get(uploadDir, String.valueOf(subjectId), folderType.name());
        Files.createDirectories(dirPath);

        // Generate a unique stored file name to avoid collisions
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String storedFileName = UUID.randomUUID() + extension;

        Path filePath = dirPath.resolve(storedFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        FileEntry entry = new FileEntry();
        entry.setSubject(subject);
        entry.setFolderType(folderType);
        entry.setOriginalFileName(originalFileName);
        entry.setStoredFileName(storedFileName);
        entry.setFileType(file.getContentType());
        entry.setFileSize(file.getSize());

        FileEntry saved = fileEntryRepository.save(entry);
        return toDTO(saved);
    }

    /**
     * List all files in a subject's folder.
     */
    public List<FileEntryDTO> listFiles(Long subjectId, FolderType folderType) {
        return fileEntryRepository.findBySubjectIdAndFolderType(subjectId, folderType)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Get metadata of a specific file.
     */
    public FileEntryDTO getFileMetadata(Long fileId) {
        FileEntry entry = fileEntryRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));
        return toDTO(entry);
    }

    /**
     * Load a file as a Spring Resource for inline serving.
     */
    public Resource loadFileAsResource(Long fileId) {
        FileEntry entry = fileEntryRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));

        try {
            Path filePath = Paths.get(uploadDir,
                    String.valueOf(entry.getSubject().getId()),
                    entry.getFolderType().name(),
                    entry.getStoredFileName());
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read file: " + entry.getOriginalFileName());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Malformed URL for file: " + fileId, e);
        }
    }

    /**
     * Load a file as a PDF Spring Resource (converts PPTX/PPT to PDF if needed).
     */
    public Resource loadFileAsPdfResource(Long fileId) {
        FileEntry entry = fileEntryRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));
        try {
            Path pdfPath;
            if (pptxToPdfService.isPresentation(entry)) {
                pdfPath = pptxToPdfService.getOrConvertToPdf(entry);
            } else {
                pdfPath = pptxToPdfService.getOriginalPath(entry);
            }
            Resource resource = new UrlResource(pdfPath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read PDF file: " + entry.getOriginalFileName());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error loading PDF for file: " + fileId, e);
        }
    }

    /**
     * Extracts Table of Contents for PDF / PPTX files.
     */
    public List<com.notesforall.dto.TocItemDTO> extractToc(Long fileId) {
        FileEntry entry = fileEntryRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));
        return pptxToPdfService.extractToc(entry);
    }

    /**
     * Get the FileEntry entity (used internally for content type resolution).
     */
    public FileEntry getFileEntry(Long fileId) {
        return fileEntryRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));
    }

    /**
     * Delete a file by ID — removes from disk and DB.
     */
    public void deleteFile(Long fileId) throws IOException {
        FileEntry entry = fileEntryRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));

        Path filePath = Paths.get(uploadDir,
                String.valueOf(entry.getSubject().getId()),
                entry.getFolderType().name(),
                entry.getStoredFileName());
        Files.deleteIfExists(filePath);

        // Also delete cached converted PDF if any
        Path pdfCachePath = Paths.get(uploadDir,
                String.valueOf(entry.getSubject().getId()),
                entry.getFolderType().name(),
                entry.getStoredFileName() + ".pdf");
        Files.deleteIfExists(pdfCachePath);

        pptxToPdfService.evictToc(fileId);

        fileEntryRepository.deleteById(fileId);
    }

    private FileEntryDTO toDTO(FileEntry entry) {
        FileEntryDTO dto = new FileEntryDTO();
        dto.setId(entry.getId());
        dto.setSubjectId(entry.getSubject().getId());
        dto.setFolderType(entry.getFolderType());
        dto.setOriginalFileName(entry.getOriginalFileName());
        dto.setFileType(entry.getFileType());
        dto.setFileSize(entry.getFileSize());
        dto.setUploadedAt(entry.getUploadedAt());
        return dto;
    }
}

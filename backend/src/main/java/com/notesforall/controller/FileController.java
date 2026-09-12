package com.notesforall.controller;

import com.notesforall.dto.FileEntryDTO;
import com.notesforall.model.FileEntry;
import com.notesforall.model.FolderType;
import com.notesforall.service.FileService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    /**
     * List all files in a subject's folder (public).
     * GET /api/subjects/{subjectId}/folders/{folderType}/files
     */
    @GetMapping("/subjects/{subjectId}/folders/{folderType}/files")
    public ResponseEntity<List<FileEntryDTO>> listFiles(
            @PathVariable Long subjectId,
            @PathVariable FolderType folderType) {
        return ResponseEntity.ok(fileService.listFiles(subjectId, folderType));
    }

    /**
     * Get file metadata (public).
     * GET /api/files/{fileId}/metadata
     */
    @GetMapping("/files/{fileId}/metadata")
    public ResponseEntity<FileEntryDTO> getMetadata(@PathVariable Long fileId) {
        return ResponseEntity.ok(fileService.getFileMetadata(fileId));
    }

    /**
     * Serve file inline — opens in browser reader (public).
     * Supports HTTP 206 Partial Content (Byte-Range requests) for fast PDF streaming,
     * proper Cache-Control, Accept-Ranges, and ETags to eliminate lag and freeze.
     * GET /api/files/{fileId}/view
     */
    @GetMapping("/files/{fileId}/view")
    public ResponseEntity<?> viewFile(
            @PathVariable Long fileId,
            @RequestHeader HttpHeaders requestHeaders) throws IOException {
        FileEntry entry = fileService.getFileEntry(fileId);
        String name = entry.getOriginalFileName() != null ? entry.getOriginalFileName().toLowerCase() : "";

        Resource resource;
        String fileName;
        MediaType mediaType;

        if (name.endsWith(".pptx") || name.endsWith(".ppt")) {
            resource = fileService.loadFileAsPdfResource(fileId);
            fileName = name.replaceFirst("\\.(pptx|ppt)$", ".pdf");
            mediaType = MediaType.APPLICATION_PDF;
        } else {
            resource = fileService.loadFileAsResource(fileId);
            fileName = entry.getOriginalFileName();
            mediaType = resolveMediaType(entry);
        }

        return createInlineResponse(resource, mediaType, fileName, entry, requestHeaders);
    }

    private ResponseEntity<?> createInlineResponse(
            Resource resource,
            MediaType mediaType,
            String fileName,
            FileEntry entry,
            HttpHeaders requestHeaders) throws IOException {

        long contentLength = resource.contentLength();
        String eTag = "\"" + entry.getId() + "-" + (entry.getStoredFileName() != null ? entry.getStoredFileName().hashCode() : 0) + "-" + contentLength + "\"";

        // Conditional request (If-None-Match) — instant 304 response
        String ifNoneMatch = requestHeaders.getFirst(HttpHeaders.IF_NONE_MATCH);
        if (ifNoneMatch != null && ifNoneMatch.equals(eTag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                    .eTag(eTag)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400, must-revalidate")
                    .build();
        }

        // Byte-Range streaming (HTTP 206 Partial Content) — allows PDF viewers to stream pages on demand
        List<HttpRange> ranges = requestHeaders.getRange();
        if (ranges != null && !ranges.isEmpty()) {
            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long rangeLength = end - start + 1;

            ResourceRegion region = new ResourceRegion(resource, start, rangeLength);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400, must-revalidate")
                    .eTag(eTag)
                    .contentType(mediaType)
                    .body(region);
        }

        // Full content response (200 OK)
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400, must-revalidate")
                .contentLength(contentLength)
                .contentType(mediaType)
                .eTag(eTag)
                .body(resource);
    }

    /**
     * Direct file download endpoint (public).
     * Supports ?format=pdf to download converted PDF for presentations, or ?format=original (default).
     * GET /api/files/{fileId}/download?format=pdf
     */
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long fileId,
            @RequestParam(required = false) String format) throws IOException {
        FileEntry entry = fileService.getFileEntry(fileId);
        String name = entry.getOriginalFileName() != null ? entry.getOriginalFileName() : "document";
        String lowerName = name.toLowerCase();

        boolean isPresentation = lowerName.endsWith(".pptx") || lowerName.endsWith(".ppt");
        if ("pdf".equalsIgnoreCase(format) && isPresentation) {
            Resource pdfResource = fileService.loadFileAsPdfResource(fileId);
            String pdfName = name.replaceFirst("(?i)\\.(pptx|ppt)$", ".pdf");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + pdfName + "\"")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentLength(pdfResource.contentLength())
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfResource);
        }

        Resource resource = fileService.loadFileAsResource(fileId);
        MediaType mediaType = resolveMediaType(entry);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + entry.getOriginalFileName() + "\"")
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .contentLength(resource.contentLength())
                .contentType(mediaType)
                .body(resource);
    }

    /**
     * Get Table of Contents / Slide Index for document (public).
     * GET /api/files/{fileId}/toc
     */
    @GetMapping("/files/{fileId}/toc")
    public ResponseEntity<List<com.notesforall.dto.TocItemDTO>> getToc(@PathVariable Long fileId) {
        return ResponseEntity.ok(fileService.extractToc(fileId));
    }

    /**
     * Map stored file types / extensions to proper MIME types.
     */
    private MediaType resolveMediaType(FileEntry entry) {
        String name = entry.getOriginalFileName() != null ? entry.getOriginalFileName().toLowerCase() : "";
        String stored = entry.getFileType() != null ? entry.getFileType().toLowerCase() : "";

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

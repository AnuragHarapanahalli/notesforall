package com.notesforall.service;

import com.notesforall.dto.TocItemDTO;
import com.notesforall.model.FileEntry;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionGoTo;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.destination.PDPageDestination;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDDocumentOutline;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDOutlineItem;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDOutlineNode;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PptxToPdfService {

    private static final Logger log = LoggerFactory.getLogger(PptxToPdfService.class);

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final Map<Long, List<TocItemDTO>> tocCache = new ConcurrentHashMap<>();

    public void evictToc(Long fileId) {
        if (fileId != null) {
            tocCache.remove(fileId);
        }
    }

    /**
     * Resolves the disk Path of a stored FileEntry.
     */
    public Path getOriginalPath(FileEntry entry) {
        return Paths.get(uploadDir,
                String.valueOf(entry.getSubject().getId()),
                entry.getFolderType().name(),
                entry.getStoredFileName());
    }

    /**
     * Resolves the disk Path of the converted PDF for a PPTX file.
     */
    public Path getConvertedPdfPath(FileEntry entry) {
        return Paths.get(uploadDir,
                String.valueOf(entry.getSubject().getId()),
                entry.getFolderType().name(),
                entry.getStoredFileName() + ".pdf");
    }

    /**
     * Check if a file is a presentation (PPTX / PPT).
     */
    public boolean isPresentation(FileEntry entry) {
        String name = entry.getOriginalFileName() != null ? entry.getOriginalFileName().toLowerCase() : "";
        String type = entry.getFileType() != null ? entry.getFileType().toLowerCase() : "";
        return name.endsWith(".pptx") || name.endsWith(".ppt") || type.contains("presentationml") || type.contains("powerpoint");
    }

    /**
     * Check if a file is a PDF.
     */
    public boolean isPdf(FileEntry entry) {
        String name = entry.getOriginalFileName() != null ? entry.getOriginalFileName().toLowerCase() : "";
        String type = entry.getFileType() != null ? entry.getFileType().toLowerCase() : "";
        return name.endsWith(".pdf") || type.contains("pdf");
    }

    /**
     * Get or convert a presentation file to PDF.
     * Caches the converted PDF alongside the original file.
     */
    public Path getOrConvertToPdf(FileEntry entry) throws IOException {
        Path pdfPath = getConvertedPdfPath(entry);
        if (Files.exists(pdfPath) && Files.size(pdfPath) > 0) {
            return pdfPath;
        }

        Path originalPath = getOriginalPath(entry);
        if (!Files.exists(originalPath)) {
            throw new IOException("Original file not found: " + originalPath);
        }

        log.info("Converting presentation to PDF: {}", entry.getOriginalFileName());
        convertPptxToPdf(originalPath, pdfPath);
        return pdfPath;
    }

    /**
     * Converts a PPTX presentation to PDF using POI and PDFBox.
     */
    public void convertPptxToPdf(Path pptxPath, Path pdfPath) throws IOException {
        try (FileInputStream is = new FileInputStream(pptxPath.toFile());
             XMLSlideShow ppt = new XMLSlideShow(is);
             PDDocument document = new PDDocument()) {

            Dimension pgsize = ppt.getPageSize();
            float width = (float) pgsize.getWidth();
            float height = (float) pgsize.getHeight();

            List<XSLFSlide> slides = ppt.getSlides();
            if (slides.isEmpty()) {
                PDPage emptyPage = new PDPage(new PDRectangle(width, height));
                document.addPage(emptyPage);
            }

            for (XSLFSlide slide : slides) {
                // Render at 2x scale for sharp readability
                int scale = 2;
                int imgWidth = (int) (width * scale);
                int imgHeight = (int) (height * scale);

                BufferedImage img = new BufferedImage(imgWidth, imgHeight, BufferedImage.TYPE_INT_RGB);
                Graphics2D graphics = img.createGraphics();

                graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

                graphics.setPaint(Color.WHITE);
                graphics.fill(new Rectangle2D.Float(0, 0, imgWidth, imgHeight));
                graphics.scale(scale, scale);

                try {
                    slide.draw(graphics);
                } catch (Exception e) {
                    log.warn("Error drawing slide, skipping graphics details: {}", e.getMessage());
                } finally {
                    graphics.dispose();
                }

                PDPage page = new PDPage(new PDRectangle(width, height));
                document.addPage(page);

                // Use JPEGFactory at 0.85f quality: ~85% smaller file, fast hardware decoding in browser, zero scroll lag
                PDImageXObject pdImage = JPEGFactory.createFromImage(document, img, 0.85f);
                try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                    contentStream.drawImage(pdImage, 0, 0, width, height);
                }
            }

            document.save(pdfPath.toFile());
            log.info("Successfully converted PPTX to PDF at {}", pdfPath);
        }
    }

    /**
     * Extracts Table of Contents for PDF or PPTX files.
     * Caches in-memory so subsequent requests return instantaneously.
     */
    public List<TocItemDTO> extractToc(FileEntry entry) {
        if (entry.getId() != null && tocCache.containsKey(entry.getId())) {
            return tocCache.get(entry.getId());
        }

        List<TocItemDTO> toc = new ArrayList<>();
        try {
            if (isPresentation(entry)) {
                Path pptxPath = getOriginalPath(entry);
                if (Files.exists(pptxPath)) {
                    try (FileInputStream is = new FileInputStream(pptxPath.toFile());
                         XMLSlideShow ppt = new XMLSlideShow(is)) {
                        List<XSLFSlide> slides = ppt.getSlides();
                        for (int i = 0; i < slides.size(); i++) {
                            XSLFSlide slide = slides.get(i);
                            int pageNum = i + 1;
                            String title = slide.getTitle();
                            if (title == null || title.trim().isEmpty()) {
                                title = "Slide " + pageNum;
                            } else {
                                title = "Slide " + pageNum + ": " + title.trim();
                            }
                            toc.add(new TocItemDTO(title, pageNum, 1, "page=" + pageNum));
                        }
                    }
                }
            } else if (isPdf(entry)) {
                Path pdfPath = getOriginalPath(entry);
                if (Files.exists(pdfPath)) {
                    try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
                        PDDocumentCatalog catalog = doc.getDocumentCatalog();
                        PDDocumentOutline outline = catalog.getDocumentOutline();
                        if (outline != null) {
                            extractOutlineItems(doc, outline, toc, 1);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract TOC for {}: {}", entry.getOriginalFileName(), e.getMessage());
        }

        if (entry.getId() != null) {
            tocCache.put(entry.getId(), toc);
        }
        return toc;
    }

    private void extractOutlineItems(PDDocument doc, PDOutlineNode node, List<TocItemDTO> toc, int level) {
        for (PDOutlineItem item : node.children()) {
            try {
                String title = item.getTitle();
                int pageNumber = 1;
                PDPage page = item.findDestinationPage(doc);
                if (page != null) {
                    pageNumber = doc.getPages().indexOf(page) + 1;
                } else if (item.getAction() instanceof PDActionGoTo) {
                    PDActionGoTo action = (PDActionGoTo) item.getAction();
                    if (action.getDestination() instanceof PDPageDestination) {
                        PDPage destPage = ((PDPageDestination) action.getDestination()).getPage();
                        if (destPage != null) {
                            pageNumber = doc.getPages().indexOf(destPage) + 1;
                        }
                    }
                }
                if (title != null && !title.trim().isEmpty()) {
                    toc.add(new TocItemDTO(title.trim(), pageNumber, level, "page=" + pageNumber));
                }
                if (item.hasChildren() && level < 4) {
                    extractOutlineItems(doc, item, toc, level + 1);
                }
            } catch (Exception e) {
                log.debug("Error processing outline item: {}", e.getMessage());
            }
        }
    }
}

package com.notesforall.dto;

public class TocItemDTO {
    private String label;
    private int pageNumber;
    private int level;
    private String anchor;

    public TocItemDTO() {}

    public TocItemDTO(String label, int pageNumber, int level, String anchor) {
        this.label = label;
        this.pageNumber = pageNumber;
        this.level = level;
        this.anchor = anchor;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public int getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(int pageNumber) {
        this.pageNumber = pageNumber;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public String getAnchor() {
        return anchor;
    }

    public void setAnchor(String anchor) {
        this.anchor = anchor;
    }
}

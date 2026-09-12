package com.notesforall.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.notesforall.model.FolderType;
import java.util.Map;

public class SubjectDTO {
    private Long id;
    private String name;
    private String description;
    private String code;
    @JsonProperty("isLive")
    @JsonAlias({"live", "isLive"})
    private boolean isLive = true;
    private Map<FolderType, Boolean> folders; // true if non-empty

    public SubjectDTO() {}

    public SubjectDTO(Long id, String name, String description, String code, boolean isLive, Map<FolderType, Boolean> folders) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.code = code;
        this.isLive = isLive;
        this.folders = folders;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    @JsonProperty("isLive")
    public boolean isLive() {
        return isLive;
    }

    @JsonProperty("isLive")
    @JsonAlias({"live", "isLive"})
    public void setLive(boolean isLive) {
        this.isLive = isLive;
    }

    public Map<FolderType, Boolean> getFolders() {
        return folders;
    }

    public void setFolders(Map<FolderType, Boolean> folders) {
        this.folders = folders;
    }
}

package com.notesforall.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subjects")
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(name = "is_live", nullable = false, columnDefinition = "boolean default true")
    @JsonProperty("isLive")
    @JsonAlias({"live", "isLive"})
    private boolean isLive = true; // Actively maintained vs deprecated/archived

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Subject() {}

    public Subject(Long id, String name, String description, String code, boolean isLive, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.code = code;
        this.isLive = isLive;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

package com.notesforall.service;

import com.notesforall.dto.SubjectDTO;
import com.notesforall.model.FileEntry;
import com.notesforall.model.FolderType;
import com.notesforall.model.Subject;
import com.notesforall.repository.FileEntryRepository;
import com.notesforall.repository.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final FileEntryRepository fileEntryRepository;

    public SubjectService(SubjectRepository subjectRepository, FileEntryRepository fileEntryRepository) {
        this.subjectRepository = subjectRepository;
        this.fileEntryRepository = fileEntryRepository;
    }

    public List<SubjectDTO> getAllSubjects() {
        return subjectRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public SubjectDTO getSubject(Long id) {
        Subject subject = subjectRepository.findById(id).orElseThrow(() -> new RuntimeException("Subject not found"));
        return toDTO(subject);
    }

    public Subject createSubject(Subject subject) {
        return subjectRepository.save(subject);
    }

    public void deleteSubject(Long id) {
        subjectRepository.deleteById(id);
    }

    public Subject updateSubject(Long id, Subject updated) {
        Subject subject = subjectRepository.findById(id).orElseThrow(() -> new RuntimeException("Subject not found"));
        if (updated.getName() != null && !updated.getName().isBlank()) {
            subject.setName(updated.getName());
        }
        if (updated.getDescription() != null) {
            subject.setDescription(updated.getDescription());
        }
        if (updated.getCode() != null && !updated.getCode().isBlank()) {
            subject.setCode(updated.getCode());
        }
        subject.setLive(updated.isLive());
        return subjectRepository.save(subject);
    }

    public Subject updateSubjectStatus(Long id, boolean isLive) {
        Subject subject = subjectRepository.findById(id).orElseThrow(() -> new RuntimeException("Subject not found"));
        subject.setLive(isLive);
        return subjectRepository.save(subject);
    }

    private SubjectDTO toDTO(Subject subject) {
        SubjectDTO dto = new SubjectDTO();
        dto.setId(subject.getId());
        dto.setName(subject.getName());
        dto.setDescription(subject.getDescription());
        dto.setCode(subject.getCode());
        dto.setLive(subject.isLive());
        
        List<FileEntry> files = fileEntryRepository.findBySubjectId(subject.getId());
        Map<FolderType, Boolean> folders = new HashMap<>();
        for (FolderType ft : FolderType.values()) {
            boolean hasFiles = files.stream().anyMatch(f -> f.getFolderType() == ft);
            if (hasFiles) {
                folders.put(ft, true);
            }
        }
        dto.setFolders(folders);
        
        return dto;
    }
}

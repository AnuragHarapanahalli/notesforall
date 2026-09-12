package com.notesforall.repository;

import com.notesforall.model.FileEntry;
import com.notesforall.model.FolderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileEntryRepository extends JpaRepository<FileEntry, Long> {
    List<FileEntry> findBySubjectIdAndFolderType(Long subjectId, FolderType folderType);
    List<FileEntry> findBySubjectId(Long subjectId);
}

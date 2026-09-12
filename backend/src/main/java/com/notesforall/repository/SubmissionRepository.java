package com.notesforall.repository;

import com.notesforall.model.Submission;
import com.notesforall.model.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByStatusOrderBySubmittedAtDesc(SubmissionStatus status);
    List<Submission> findAllByOrderBySubmittedAtDesc();
    long countByStatus(SubmissionStatus status);
}

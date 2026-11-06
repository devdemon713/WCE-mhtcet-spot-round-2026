package com.wce.acap.repository;

import com.wce.acap.model.Allocation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AllocationRepository extends MongoRepository<Allocation, String> {
    List<Allocation> findByStudentAndStatusNot(String student, String status);
    List<Allocation> findAllByOrderByCreatedAtDesc();
    List<Allocation> findByRoundOrderByCreatedAtDesc(String round);
    List<Allocation> findByStatusNot(String status);
    List<Allocation> findByRoundAndStatusNot(String round, String status);
    long countByStatusNot(String status);
    List<Allocation> findByStudent(String student);
}


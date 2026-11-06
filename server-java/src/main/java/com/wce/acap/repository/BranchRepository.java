package com.wce.acap.repository;

import com.wce.acap.model.Branch;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BranchRepository extends MongoRepository<Branch, String> {
    List<Branch> findByIsActiveOrderByChoiceCodeAsc(boolean isActive);
    List<Branch> findByIsActiveAndTypeOrderByChoiceCodeAsc(boolean isActive, String type);
    Optional<Branch> findByChoiceCode(String choiceCode);
}


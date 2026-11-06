package com.wce.acap.repository;

import com.wce.acap.model.Round;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RoundRepository extends MongoRepository<Round, String> {
    Optional<Round> findTopByOrderByCreatedAtDesc();
}


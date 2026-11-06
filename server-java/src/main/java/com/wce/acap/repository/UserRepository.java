package com.wce.acap.repository;

import com.wce.acap.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByApplicationId(String applicationId);
    boolean existsByEmail(String email);
    boolean existsByApplicationId(String applicationId);

    List<User> findByRoleAndAllocationStatus(String role, String allocationStatus);
    List<User> findByRole(String role);

    @Query("{ 'role': 'student', 'allocationStatus': 'pending' }")
    List<User> findPendingStudents();

    long countByRoleAndAllocationStatus(String role, String status);
    long countByRole(String role);
}


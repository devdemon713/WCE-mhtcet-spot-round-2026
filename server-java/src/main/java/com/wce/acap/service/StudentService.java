package com.wce.acap.service;

import com.wce.acap.model.User;
import com.wce.acap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    public List<User> getStudents(String category, String status, String search, String gender) {
        Query query = new Query(Criteria.where("role").is("student"));

        if (category != null && !category.isEmpty()) query.addCriteria(Criteria.where("category").is(category));
        if (status != null && !status.isEmpty()) query.addCriteria(Criteria.where("allocationStatus").is(status));
        if (gender != null && !gender.isEmpty()) query.addCriteria(Criteria.where("gender").is(gender));
        if (search != null && !search.isEmpty()) {
            Pattern pattern = Pattern.compile(search, Pattern.CASE_INSENSITIVE);
            Criteria searchCriteria = new Criteria().orOperator(
                Criteria.where("fullName").regex(pattern),
                Criteria.where("applicationId").regex(pattern),
                Criteria.where("email").regex(pattern)
            );
            query.addCriteria(searchCriteria);
        }

        List<User> students = mongoTemplate.find(query, User.class);
        // Sort: wceMeritNumber asc (nulls last), mhtCetPercentile desc
        students.sort((a, b) -> {
            String wA = a.getWceMeritNumber();
            String wB = b.getWceMeritNumber();
            if (wA != null && wB != null) {
                try {
                    int diff = Integer.parseInt(wA) - Integer.parseInt(wB);
                    if (diff != 0) return diff;
                } catch (NumberFormatException e) {
                    int c = wA.compareTo(wB);
                    if (c != 0) return c;
                }
            } else if (wA != null) return -1;
            else if (wB != null) return 1;
            return Double.compare(
                b.getMhtCetPercentile() != null ? b.getMhtCetPercentile() : 0,
                a.getMhtCetPercentile() != null ? a.getMhtCetPercentile() : 0
            );
        });
        // Remove password from results (password is not in model response)
        students.forEach(s -> s.setPassword(null));
        return students;
    }

    public Map<String, Object> getStats() {
        long total     = userRepository.countByRole("student");
        long pending   = userRepository.countByRoleAndAllocationStatus("student", "pending");
        long allocated = userRepository.countByRoleAndAllocationStatus("student", "allocated");
        long confirmed = userRepository.countByRoleAndAllocationStatus("student", "confirmed");
        long cancelled = userRepository.countByRoleAndAllocationStatus("student", "cancelled");

        Aggregation agg = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("role").is("student")),
            Aggregation.group("category").count().as("count")
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(agg, "users", Map.class);
        List<Map> categoryWise = results.getMappedResults();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("allocated", allocated);
        stats.put("confirmed", confirmed);
        stats.put("cancelled", cancelled);
        stats.put("categoryWise", categoryWise);
        return stats;
    }

    public User getStudentById(String id) {
        User student = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        student.setPassword(null);
        return student;
    }
}


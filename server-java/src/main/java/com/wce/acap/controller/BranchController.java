package com.wce.acap.controller;

import com.wce.acap.model.Branch;
import com.wce.acap.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    public ResponseEntity<List<Branch>> getAll(@RequestParam(required = false) String type) {
        return ResponseEntity.ok(branchService.getAllBranches(type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(branchService.getBranchById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(branchService.updateBranch(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetBranch(@PathVariable String id) {
        try {
            return ResponseEntity.ok(branchService.resetBranchSeats(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetAll() {
        List<Branch> branches = branchService.resetAllSeats();
        return ResponseEntity.ok(Map.of(
            "message", "All seats reset. Ready to enter actual vacancy data.",
            "branches", branches
        ));
    }
}


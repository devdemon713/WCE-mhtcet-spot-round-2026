package com.wce.acap.controller;

import com.wce.acap.dto.ManualAllocationRequest;
import com.wce.acap.dto.UpgradeAllocationRequest;
import com.wce.acap.model.User;
import com.wce.acap.service.AllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/allocation")
@RequiredArgsConstructor
public class AllocationController {

    private final AllocationService allocationService;

    @PostMapping("/manual")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> manual(@RequestBody ManualAllocationRequest req,
                                    @AuthenticationPrincipal User admin) {
        try {
            return ResponseEntity.status(201).body(
                allocationService.manualAllocate(req.getStudentId(), req.getBranchId(),
                    req.getSeatCategory(), req.getSeatType(), req.getSeatPool(),
                    admin != null ? admin.getId() : null)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/upgrade")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> upgrade(@RequestBody UpgradeAllocationRequest req,
                                     @AuthenticationPrincipal User admin) {
        try {
            if (req.getStudentId() == null || req.getFromBranchId() == null || req.getToBranchId() == null)
                return ResponseEntity.badRequest().body(Map.of("message", "studentId, fromBranchId, and toBranchId are required"));
            return ResponseEntity.status(201).body(
                allocationService.upgradeAllocate(req.getStudentId(),
                    req.getFromBranchId(), req.getFromSeatPool(), req.getFromSeatCategory(), req.getFromSeatType(),
                    req.getToBranchId(), req.getToSeatPool(), req.getToSeatCategory(), req.getToSeatType(),
                    admin != null ? admin.getId() : null)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/auto")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> auto(@RequestBody(required = false) Map<String, String> body,
                                  @AuthenticationPrincipal User admin) {
        try {
            String branchId = body != null ? body.get("branchId") : null;
            return ResponseEntity.ok(
                allocationService.autoAllocate(branchId, admin != null ? admin.getId() : null)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> history(@RequestParam(required = false) String roundId) {
        return ResponseEntity.ok(allocationService.getHistory(roundId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cancel(@PathVariable String id) {
        try {
            allocationService.cancelAllocation(id);
            return ResponseEntity.ok(Map.of("message", "Allocation cancelled, seat returned to pool"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentAllocation(@PathVariable String studentId,
                                                   @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        if (!currentUser.getId().equals(studentId) && !"admin".equals(currentUser.getRole()))
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        return ResponseEntity.ok(allocationService.getStudentAllocation(studentId).orElse(null));
    }

    @PostMapping("/skip")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> skip(@RequestBody Map<String, String> body) {
        try {
            String studentId = body.get("studentId");
            if (studentId == null) return ResponseEntity.badRequest().body(Map.of("message", "studentId is required"));
            var student = allocationService.skipStudent(studentId);
            return ResponseEntity.ok(Map.of("message", student.getFullName() + " skipped for this round", "studentId", student.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/unskip")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unskip(@RequestBody Map<String, String> body) {
        try {
            String studentId = body.get("studentId");
            if (studentId == null) return ResponseEntity.badRequest().body(Map.of("message", "studentId is required"));
            var student = allocationService.unskipStudent(studentId);
            return ResponseEntity.ok(Map.of("message", student.getFullName() + " unskipped for this round", "studentId", student.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/round-summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> roundSummary() {
        return ResponseEntity.ok(allocationService.getRoundSummary());
    }

    @GetMapping("/export-csv")
    @PreAuthorize("hasRole('ADMIN')")
    public void exportCsv(@RequestParam(required = false) String roundId,
                           HttpServletResponse response) throws IOException {
        String csv = allocationService.exportCsv(roundId);
        String filename = "allocated-students-" + LocalDate.now() + ".csv";
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        response.getWriter().write(csv);
    }
}


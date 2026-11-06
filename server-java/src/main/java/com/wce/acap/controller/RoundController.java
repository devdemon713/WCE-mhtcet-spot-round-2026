package com.wce.acap.controller;

import com.wce.acap.dto.AlertRequest;
import com.wce.acap.dto.AnnouncementRequest;
import com.wce.acap.model.User;
import com.wce.acap.service.RoundService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/round")
@RequiredArgsConstructor
public class RoundController {

    private final RoundService roundService;

    @GetMapping("/current")
    public ResponseEntity<?> getCurrent() {
        return ResponseEntity.ok(roundService.getCurrentRound());
    }

    @PutMapping("/announcement")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAnnouncement(@RequestBody AnnouncementRequest req) {
        try {
            var round = roundService.updateAnnouncement(
                req.getAnnouncementText(), req.getAnnouncementEnabled(),
                req.getAnnouncementDirection(), req.getResetToDefault());
            return ResponseEntity.ok(Map.of("message", "Announcement updated", "round", round));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/alert")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> sendAlert(@RequestBody AlertRequest req,
                                       @AuthenticationPrincipal User admin) {
        if (req.getMessage() == null || req.getMessage().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Alert message required"));
        roundService.broadcastAlert(req.getMessage(), req.getType(),
            admin != null ? admin.getFullName() : "Admin");
        return ResponseEntity.ok(Map.of("message", "Alert broadcast sent"));
    }

    @PostMapping("/initialize")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> initialize(@RequestBody(required = false) Map<String, String> body) {
        try {
            String name = body != null ? body.get("name") : null;
            var round = roundService.initializeRound(name);
            return ResponseEntity.ok(Map.of(
                "message", "Round " + round.getRoundNumber() + " initialized. Existing seats and allocations are preserved.",
                "round", round
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/start")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> start() {
        try {
            return ResponseEntity.ok(Map.of("message", "Round started!", "round", roundService.startRound()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/pause")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> pause() {
        try {
            return ResponseEntity.ok(Map.of("message", "Round paused", "round", roundService.pauseRound()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/end")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> end() {
        try {
            return ResponseEntity.ok(Map.of("message", "Round completed", "round", roundService.endRound()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/break")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> breakControl(@RequestBody Map<String, String> body) {
        try {
            String action = body.get("action");
            String type   = body.get("type");
            roundService.broadcastBreak(action, type);
            return ResponseEntity.ok(Map.of("message", "break-" + action + " broadcast sent"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}


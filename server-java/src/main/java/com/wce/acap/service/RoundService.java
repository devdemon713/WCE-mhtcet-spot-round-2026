package com.wce.acap.service;

import com.wce.acap.model.Allocation;
import com.wce.acap.model.Branch;
import com.wce.acap.model.Round;
import com.wce.acap.repository.AllocationRepository;
import com.wce.acap.repository.BranchRepository;
import com.wce.acap.repository.RoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RoundService {

    private final RoundRepository roundRepository;
    private final BranchRepository branchRepository;
    private final AllocationRepository allocationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final BranchService branchService;

    public Round getCurrentRound() {
        return roundRepository.findTopByOrderByCreatedAtDesc().orElseGet(() -> {
            Round round = new Round();
            round.setName("ACAP Round 2025-26");
            round.setStatus("demo");
            round.setDemo(true);
            return roundRepository.save(round);
        });
    }

    public Round updateAnnouncement(String text, Boolean enabled, String direction, Boolean resetToDefault) {
        Round round = roundRepository.findTopByOrderByCreatedAtDesc()
            .orElseThrow(() -> new RuntimeException("No round found"));

        if (Boolean.TRUE.equals(resetToDefault)) {
            round.setAnnouncementText("THIS FORM IS ONLY FOR STUDENTS APPLYING FOR 1ST YEAR ACAP ROUND REGISTRATION");
        } else if (text != null) {
            String trimmed = text.trim();
            round.setAnnouncementText(trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed);
        }
        if (enabled != null) round.setAnnouncementEnabled(enabled);
        if ("ltr".equals(direction) || "rtl".equals(direction)) round.setAnnouncementDirection(direction);
        Round saved = roundRepository.save(round);
        broadcastRoundEvent("announcement-update", saved);
        return saved;
    }

    public void broadcastAlert(String message, String type, String adminName) {
        List<String> validTypes = List.of("info", "success", "warning", "urgent");
        String alertType = validTypes.contains(type) ? type : "info";
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", message.trim().length() > 300 ? message.trim().substring(0, 300) : message.trim());
        payload.put("type", alertType);
        payload.put("sentAt", Instant.now());
        payload.put("sentBy", adminName != null ? adminName : "Admin");
        messagingTemplate.convertAndSend("/topic/admin-alert", payload);
    }

    public Round initializeRound(String name) {
        Round prev = roundRepository.findTopByOrderByCreatedAtDesc().orElse(null);
        int nextNumber = prev != null ? (prev.getRoundNumber() + 1) : 1;

        // Mark previous rounds completed
        List<Round> all = roundRepository.findAll();
        all.stream().filter(r -> !"completed".equals(r.getStatus())).forEach(r -> {
            r.setStatus("completed");
            r.setEndedAt(Instant.now());
            roundRepository.save(r);
        });

        Round round = new Round();
        round.setName(name != null ? name : "ACAP Round 2025-26 — Round " + nextNumber);
        round.setStatus("setup");
        round.setDemo(false);
        round.setRoundNumber(nextNumber);
        round.setDescription("Round " + nextNumber + " — seats and previous allocations preserved");
        Round saved = roundRepository.save(round);
        broadcastRoundEvent("round-update", saved);
        return saved;
    }

    public Round startRound() {
        Round round = roundRepository.findTopByOrderByCreatedAtDesc()
            .orElseThrow(() -> new RuntimeException("No round found"));
        round.setStatus("active");
        round.setStartedAt(Instant.now());

        List<Branch> branches = branchRepository.findByIsActiveOrderByChoiceCodeAsc(true);
        int totalSeats = branches.stream().mapToInt(b -> {
            branchService.populateVirtuals(b);
            return b.getTotalVacant();
        }).sum();
        round.setTotalSeatsInitial(totalSeats);
        Round saved = roundRepository.save(round);
        broadcastRoundEvent("round-update", saved);
        return saved;
    }

    public Round pauseRound() {
        Round round = roundRepository.findTopByOrderByCreatedAtDesc()
            .orElseThrow(() -> new RuntimeException("No round found"));
        round.setStatus("paused");
        Round saved = roundRepository.save(round);
        broadcastRoundEvent("round-update", saved);
        return saved;
    }

    public Round endRound() {
        Round round = roundRepository.findTopByOrderByCreatedAtDesc()
            .orElseThrow(() -> new RuntimeException("No round found"));
        round.setStatus("completed");
        round.setEndedAt(Instant.now());
        long allocated = allocationRepository.countByStatusNot("cancelled");
        round.setTotalSeatsAllocated((int) allocated);
        Round saved = roundRepository.save(round);
        broadcastRoundEvent("round-update", saved);
        return saved;
    }

    public void broadcastBreak(String action, String type) {
        if ("start".equals(action)) {
            if (!List.of("tea", "lunch").contains(type))
                throw new RuntimeException("Invalid break type. Use \"tea\" or \"lunch\".");
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", type);
            payload.put("startedAt", Instant.now());
            messagingTemplate.convertAndSend("/topic/break-start", payload);
        } else if ("end".equals(action)) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("endedAt", Instant.now());
            messagingTemplate.convertAndSend("/topic/break-end", payload);
        } else {
            throw new RuntimeException("Invalid action. Use \"start\" or \"end\".");
        }
    }

    private void broadcastRoundEvent(String topic, Round round) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("round", round);
        payload.put("updatedAt", Instant.now());
        messagingTemplate.convertAndSend("/topic/" + topic, payload);
    }
}


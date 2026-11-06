package com.wce.acap.service;

import com.wce.acap.model.*;
import com.wce.acap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AllocationService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final AllocationRepository allocationRepository;
    private final RoundRepository roundRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final BranchService branchService;

    // ── Seat Helpers ──────────────────────────────────────────────────────────

    private Branch decrementSeat(String branchId, String seatPool, String seatCategory, String seatType) {
        Branch branch = branchRepository.findById(branchId)
            .orElseThrow(() -> new RuntimeException("Branch not found"));

        switch (seatPool) {
            case "stateLevel" -> adjustCategorySlot(branch.getStateLevel(), seatCategory, seatType, -1);
            case "pwd"        -> adjustCategorySlot(branch.getPwd(), seatCategory, seatType, -1);
            case "def"        -> adjustCategorySlot(branch.getDef(), seatCategory, seatType, -1);
            case "ewsSeats"           -> branch.setEwsSeats(assertPositive(branch.getEwsSeats(), seatPool) - 1);
            case "minoritySeats"      -> branch.setMinoritySeats(assertPositive(branch.getMinoritySeats(), seatPool) - 1);
            case "orphanSeats"        -> branch.setOrphanSeats(assertPositive(branch.getOrphanSeats(), seatPool) - 1);
            case "pwdCommonReserved"  -> branch.setPwdCommonReserved(assertPositive(branch.getPwdCommonReserved(), seatPool) - 1);
            case "defCommonReserved"  -> branch.setDefCommonReserved(assertPositive(branch.getDefCommonReserved(), seatPool) - 1);
            case "allIndiaSeats"      -> branch.setAllIndiaSeats(assertPositive(branch.getAllIndiaSeats(), seatPool) - 1);
            case "instituteSeats"     -> branch.setInstituteSeats(assertPositive(branch.getInstituteSeats(), seatPool) - 1);
            default -> throw new RuntimeException("Unknown seat pool: " + seatPool);
        }
        Branch saved = branchRepository.save(branch);
        branchService.populateVirtuals(saved);
        return saved;
    }

    private Branch incrementSeat(String branchId, String seatPool, String seatCategory, String seatType) {
        Branch branch = branchRepository.findById(branchId)
            .orElseThrow(() -> new RuntimeException("Branch not found"));

        switch (seatPool) {
            case "stateLevel" -> adjustCategorySlot(branch.getStateLevel(), seatCategory, seatType, +1);
            case "pwd"        -> adjustCategorySlot(branch.getPwd(), seatCategory, seatType, +1);
            case "def"        -> adjustCategorySlot(branch.getDef(), seatCategory, seatType, +1);
            case "ewsSeats"           -> branch.setEwsSeats(branch.getEwsSeats() + 1);
            case "minoritySeats"      -> branch.setMinoritySeats(branch.getMinoritySeats() + 1);
            case "orphanSeats"        -> branch.setOrphanSeats(branch.getOrphanSeats() + 1);
            case "pwdCommonReserved"  -> branch.setPwdCommonReserved(branch.getPwdCommonReserved() + 1);
            case "defCommonReserved"  -> branch.setDefCommonReserved(branch.getDefCommonReserved() + 1);
            case "allIndiaSeats"      -> branch.setAllIndiaSeats(branch.getAllIndiaSeats() + 1);
            case "instituteSeats"     -> branch.setInstituteSeats(branch.getInstituteSeats() + 1);
            default -> {}
        }
        Branch saved = branchRepository.save(branch);
        branchService.populateVirtuals(saved);
        return saved;
    }

    private void adjustCategorySlot(Map<String, CategorySlot> map, String cat, String type, int delta) {
        if (map == null) throw new RuntimeException("Seat map is null");
        CategorySlot slot = map.computeIfAbsent(cat, k -> new CategorySlot());
        if (delta < 0) {
            int current = "ladies".equals(type) ? slot.getLadies() : slot.getGeneral();
            if (current <= 0) throw new RuntimeException("No seats available in " + cat + "/" + type);
        }
        if ("ladies".equals(type)) slot.setLadies(slot.getLadies() + delta);
        else slot.setGeneral(slot.getGeneral() + delta);
    }

    private int assertPositive(int value, String pool) {
        if (value <= 0) throw new RuntimeException("No seats available in pool: " + pool);
        return value;
    }

    private boolean hasSeat(Branch branch, String pool, String cat, String type) {
        return switch (pool) {
            case "stateLevel" -> hasCategorySlot(branch.getStateLevel(), cat, type);
            case "pwd"        -> hasCategorySlot(branch.getPwd(), cat, type);
            case "def"        -> hasCategorySlot(branch.getDef(), cat, type);
            case "ewsSeats"           -> branch.getEwsSeats() > 0;
            case "minoritySeats"      -> branch.getMinoritySeats() > 0;
            case "orphanSeats"        -> branch.getOrphanSeats() > 0;
            case "pwdCommonReserved"  -> branch.getPwdCommonReserved() > 0;
            case "defCommonReserved"  -> branch.getDefCommonReserved() > 0;
            case "allIndiaSeats"      -> branch.getAllIndiaSeats() > 0;
            case "instituteSeats"     -> branch.getInstituteSeats() > 0;
            default -> false;
        };
    }

    private boolean hasCategorySlot(Map<String, CategorySlot> map, String cat, String type) {
        if (map == null || cat == null || !map.containsKey(cat)) return false;
        CategorySlot slot = map.get(cat);
        return "ladies".equals(type) ? slot.getLadies() > 0 : slot.getGeneral() > 0;
    }

    // ── Announcement push ─────────────────────────────────────────────────────

    private void pushAllocationAnnouncement(String studentName, String meritNumber,
                                             String branchName, String branchType,
                                             String category, String seatType) {
        try {
            Round round = roundRepository.findTopByOrderByCreatedAtDesc().orElse(null);
            if (round == null) return;
            String typeLabel = "ladies".equals(seatType) ? "(Ladies)" : "";
            String meritLabel = meritNumber != null ? " (Merit No. " + meritNumber + ")" : "";
            String newEntry = "🎉 " + studentName + meritLabel + " secured " + branchName +
                              " (" + branchType + ") — " + category + " " + typeLabel + " seat";
            String existing = round.getAnnouncementText() != null ? round.getAnnouncementText() : "";
            String[] parts = existing.split("  \\|  ");
            List<String> allocParts = new ArrayList<>();
            List<String> baseParts = new ArrayList<>();
            for (String p : parts) {
                if (p.startsWith("🎉") && allocParts.size() < 4) allocParts.add(p);
                else if (!p.startsWith("🎉")) baseParts.add(p);
            }
            List<String> combined = new ArrayList<>();
            combined.add(newEntry);
            combined.addAll(allocParts);
            combined.addAll(baseParts);
            String joined = String.join("  |  ", combined);
            round.setAnnouncementText(joined.length() > 500 ? joined.substring(0, 500) : joined);
            roundRepository.save(round);
            Map<String, Object> payload = new HashMap<>();
            payload.put("round", round);
            payload.put("updatedAt", Instant.now());
            messagingTemplate.convertAndSend("/topic/announcement-update", payload);
        } catch (Exception e) {
            log.warn("Announcement push error: {}", e.getMessage());
        }
    }

    // ── Manual Allocation ─────────────────────────────────────────────────────

    public Map<String, Object> manualAllocate(String studentId, String branchId,
                                               String seatCategory, String seatType,
                                               String seatPool, String adminId) {
        Round currentRound = roundRepository.findTopByOrderByCreatedAtDesc().orElse(null);
        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));

        // Return previous seat if re-allocating
        if ("allocated".equals(student.getAllocationStatus()) || "confirmed".equals(student.getAllocationStatus())) {
            if (student.getAllocatedBranch() != null) {
                try {
                    incrementSeat(student.getAllocatedBranch(),
                        student.getAllocatedSeatPool() != null ? student.getAllocatedSeatPool() : "stateLevel",
                        student.getAllocatedSeatCategory() != null ? student.getAllocatedSeatCategory() : student.getCategory(),
                        student.getAllocatedSeatType() != null ? student.getAllocatedSeatType() : "general");
                } catch (Exception e) { log.warn("Could not return previous seat: {}", e.getMessage()); }
            }
            allocationRepository.findByStudentAndStatusNot(studentId, "cancelled")
                .forEach(a -> { a.setStatus("cancelled"); allocationRepository.save(a); });
        }

        String pool = seatPool != null ? seatPool : "stateLevel";
        Branch branch = decrementSeat(branchId, pool, seatCategory, seatType);

        Allocation allocation = new Allocation();
        allocation.setStudent(studentId);
        allocation.setBranch(branchId);
        allocation.setSeatCategory(seatCategory);
        allocation.setSeatType(seatType);
        allocation.setSeatPool(pool);
        allocation.setAllocatedBy("manual");
        allocation.setAllocatedByAdmin(adminId);
        allocation.setRound(currentRound != null ? currentRound.getId() : null);
        allocation.setStatus("allocated");
        allocationRepository.save(allocation);

        student.setAllocationStatus("allocated");
        student.setAllocatedBranch(branchId);
        student.setAllocatedSeatCategory(seatCategory);
        student.setAllocatedSeatType(seatType);
        student.setAllocatedSeatPool(pool);
        userRepository.save(student);

        broadcastSeatUpdate(branch);
        broadcastAllocationUpdate(studentId);
        pushAllocationAnnouncement(student.getFullName(), student.getWceMeritNumber(),
            branch.getName(), branch.getType(), seatCategory, seatType);

        Map<String, Object> result = new HashMap<>();
        result.put("allocation", allocation);
        result.put("branch", branch);
        result.put("student", sanitize(student));
        return result;
    }

    // ── Upgrade Allocation ────────────────────────────────────────────────────

    public Map<String, Object> upgradeAllocate(String studentId,
            String fromBranchId, String fromPool, String fromCat, String fromType,
            String toBranchId, String toPool, String toCat, String toType, String adminId) {

        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        Branch fromBranch = branchRepository.findById(fromBranchId)
            .orElseThrow(() -> new RuntimeException("Source branch not found"));
        Branch toBranch = branchRepository.findById(toBranchId)
            .orElseThrow(() -> new RuntimeException("Target branch not found"));

        String toPoolFinal = toPool != null ? toPool : "stateLevel";
        String fromPoolFinal = fromPool != null ? fromPool : "stateLevel";

        if (!hasSeat(toBranch, toPoolFinal, toCat, toType)) {
            throw new RuntimeException("No vacant seat available in target branch (" + toBranch.getName() + ")");
        }

        Branch updatedFrom = incrementSeat(fromBranchId, fromPoolFinal, fromCat, fromType);
        Branch updatedTo   = decrementSeat(toBranchId, toPoolFinal, toCat, toType);

        allocationRepository.findByStudentAndStatusNot(studentId, "cancelled")
            .forEach(a -> { a.setStatus("cancelled"); allocationRepository.save(a); });

        Allocation allocation = new Allocation();
        allocation.setStudent(studentId);
        allocation.setBranch(toBranchId);
        allocation.setSeatCategory(toCat);
        allocation.setSeatType(toType);
        allocation.setSeatPool(toPoolFinal);
        allocation.setAllocatedBy("upgrade");
        allocation.setAllocatedByAdmin(adminId);
        allocation.setUpgradeFromBranch(fromBranchId);
        allocation.setStatus("allocated");
        allocationRepository.save(allocation);

        student.setAllocationStatus("allocated");
        student.setAllocatedBranch(toBranchId);
        student.setAllocatedSeatCategory(toCat);
        student.setAllocatedSeatType(toType);
        student.setAllocatedSeatPool(toPoolFinal);
        userRepository.save(student);

        broadcastSeatUpdate(updatedFrom);
        broadcastSeatUpdate(updatedTo);
        broadcastAllocationUpdate(studentId);
        pushAllocationAnnouncement(student.getFullName(), student.getWceMeritNumber(),
            toBranch.getName(), toBranch.getType(), toCat, toType);

        log.info("Branch Upgrade: {} | {} → {}", student.getApplicationId(), fromBranch.getName(), toBranch.getName());

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Branch upgrade successful: " + fromBranch.getName() + " → " + toBranch.getName());
        result.put("allocation", allocation);
        result.put("fromBranch", updatedFrom);
        result.put("toBranch", updatedTo);
        return result;
    }

    // ── Auto Allocation ───────────────────────────────────────────────────────

    public Map<String, Object> autoAllocate(String branchIdFilter, String adminId) {
        Round currentRound = roundRepository.findTopByOrderByCreatedAtDesc().orElse(null);
        String currentRoundId = currentRound != null ? currentRound.getId() : null;

        // Fetch pending students sorted by merit
        List<User> allPending = userRepository.findPendingStudents();
        allPending.sort(Comparator
            .comparingDouble((User u) -> u.getMhtCetPercentile() != null ? -u.getMhtCetPercentile() : 0)
            .thenComparingDouble(u -> u.getMhtCetScore() != null ? -u.getMhtCetScore() : 0)
            .thenComparingDouble(u -> u.getSscAggregate() != null ? -u.getSscAggregate() : 0));

        // Filter out skipped students for this round
        final String roundId = currentRoundId;
        List<User> pendingStudents = roundId == null ? allPending :
            allPending.stream().filter(s ->
                s.getSkippedInRounds() == null || !s.getSkippedInRounds().contains(roundId)
            ).toList();

        if (pendingStudents.isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("message", "No pending students to allocate");
            res.put("allocations", List.of());
            return res;
        }

        List<Branch> branches = branchIdFilter != null
            ? branchRepository.findById(branchIdFilter).map(List::of).orElse(List.of())
            : branchRepository.findByIsActiveOrderByChoiceCodeAsc(true);

        List<Allocation> allocations = new ArrayList<>();

        for (User student : pendingStudents) {
            boolean allocated = false;
            String effectiveCat = "Non-CAP".equals(student.getStudentType()) ? "OPEN" : student.getCategory();
            boolean isFemale = "Female".equals(student.getGender());

            for (Branch branch : branches) {
                if (allocated) break;

                // Build seat attempt list in MHT-CET priority order
                List<SeatAttempt> attempts = new ArrayList<>();

                if (Boolean.TRUE.equals(student.getIsOrphan()))
                    attempts.add(new SeatAttempt("orphanSeats", null, null, "Orphan"));
                if (Boolean.TRUE.equals(student.getIsMinority()))
                    attempts.add(new SeatAttempt("minoritySeats", null, null, "Minority"));
                if (Boolean.TRUE.equals(student.getIsPWD())) {
                    if (!"OPEN".equals(effectiveCat))
                        attempts.add(new SeatAttempt("pwd", effectiveCat, "general", "PWD-" + effectiveCat));
                    attempts.add(new SeatAttempt("pwd", "OPEN", "general", "PWD-OPEN"));
                    attempts.add(new SeatAttempt("pwdCommonReserved", null, null, "PWD-Common"));
                }
                if (Boolean.TRUE.equals(student.getIsDEF())) {
                    if (!"OPEN".equals(effectiveCat))
                        attempts.add(new SeatAttempt("def", effectiveCat, "general", "DEF-" + effectiveCat));
                    attempts.add(new SeatAttempt("def", "OPEN", "general", "DEF-OPEN"));
                    attempts.add(new SeatAttempt("defCommonReserved", null, null, "DEF-Common"));
                }
                if ("EWS".equals(effectiveCat))
                    attempts.add(new SeatAttempt("ewsSeats", null, null, "EWS"));
                if (!"OPEN".equals(effectiveCat) && !"EWS".equals(effectiveCat)) {
                    if (isFemale)
                        attempts.add(new SeatAttempt("stateLevel", effectiveCat, "ladies", effectiveCat + "-L"));
                    attempts.add(new SeatAttempt("stateLevel", effectiveCat, "general", effectiveCat + "-G"));
                }
                if (isFemale)
                    attempts.add(new SeatAttempt("stateLevel", "OPEN", "ladies", "OPEN-L"));
                attempts.add(new SeatAttempt("stateLevel", "OPEN", "general", "OPEN-G"));

                for (SeatAttempt attempt : attempts) {
                    try {
                        // Always re-fetch for latest counts
                        Branch freshBranch = branchRepository.findById(branch.getId()).orElse(null);
                        if (freshBranch == null) continue;
                        if (!hasSeat(freshBranch, attempt.pool, attempt.cat, attempt.type)) continue;

                        Branch updatedBranch = decrementSeat(branch.getId(), attempt.pool, attempt.cat, attempt.type);

                        String allocCat = attempt.cat != null ? attempt.cat : effectiveCat;
                        String allocType = attempt.type != null ? attempt.type : "general";

                        Allocation alloc = new Allocation();
                        alloc.setStudent(student.getId());
                        alloc.setBranch(branch.getId());
                        alloc.setSeatCategory(allocCat);
                        alloc.setSeatType(allocType);
                        alloc.setSeatPool(attempt.pool);
                        alloc.setAllocatedBy("auto");
                        alloc.setAllocatedByAdmin(adminId);
                        alloc.setRound(roundId);
                        alloc.setStatus("allocated");
                        allocationRepository.save(alloc);

                        student.setAllocationStatus("allocated");
                        student.setAllocatedBranch(branch.getId());
                        student.setAllocatedSeatCategory(allocCat);
                        student.setAllocatedSeatType(allocType);
                        student.setAllocatedSeatPool(attempt.pool);
                        userRepository.save(student);

                        allocations.add(alloc);
                        broadcastSeatUpdate(updatedBranch);
                        broadcastAllocationUpdate(student.getId());
                        log.info("Auto-allocated: {} → {} [{}]", student.getApplicationId(), branch.getName(), attempt.label);
                        allocated = true;
                        break;
                    } catch (Exception e) {
                        // seat unavailable or taken, try next
                    }
                }
            }
            if (!allocated) {
                log.warn("No seat: {} ({}, {}%ile)", student.getApplicationId(), student.getCategory(), student.getMhtCetPercentile());
            }
        }

        // Broadcast batch complete
        Map<String, Object> batchPayload = new HashMap<>();
        batchPayload.put("count", allocations.size());
        batchPayload.put("updatedAt", Instant.now());
        messagingTemplate.convertAndSend("/topic/allocation-batch-complete", batchPayload);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Successfully allocated " + allocations.size() + " out of " + pendingStudents.size() + " students");
        result.put("allocated", allocations.size());
        result.put("unallocated", pendingStudents.size() - allocations.size());
        result.put("allocations", allocations);
        return result;
    }

    // ── History ───────────────────────────────────────────────────────────────

    public List<Allocation> getHistory(String roundId) {
        return roundId != null
            ? allocationRepository.findByRoundOrderByCreatedAtDesc(roundId)
            : allocationRepository.findAllByOrderByCreatedAtDesc();
    }

    // ── Cancel Allocation ─────────────────────────────────────────────────────

    public void cancelAllocation(String allocationId) {
        Allocation allocation = allocationRepository.findById(allocationId)
            .orElseThrow(() -> new RuntimeException("Allocation not found"));

        Branch branch = incrementSeat(allocation.getBranch(), allocation.getSeatPool(),
            allocation.getSeatCategory(), allocation.getSeatType());

        userRepository.findById(allocation.getStudent()).ifPresent(student -> {
            student.setAllocationStatus("pending");
            student.setAllocatedBranch(null);
            student.setAllocatedSeatCategory(null);
            student.setAllocatedSeatType(null);
            student.setAllocatedSeatPool(null);
            userRepository.save(student);
        });

        allocation.setStatus("cancelled");
        allocationRepository.save(allocation);
        broadcastSeatUpdate(branch);
    }

    // ── Student Allocation ────────────────────────────────────────────────────

    public Optional<Allocation> getStudentAllocation(String studentId) {
        return allocationRepository.findByStudent(studentId).stream()
            .filter(a -> !"cancelled".equals(a.getStatus()))
            .findFirst();
    }

    // ── Skip / Unskip ─────────────────────────────────────────────────────────

    public User skipStudent(String studentId) {
        Round round = roundRepository.findTopByOrderByCreatedAtDesc()
            .orElseThrow(() -> new RuntimeException("No active round"));
        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        if (student.getSkippedInRounds() == null) student.setSkippedInRounds(new ArrayList<>());
        if (student.getSkippedInRounds().contains(round.getId()))
            throw new RuntimeException("Student already skipped in this round");
        student.getSkippedInRounds().add(round.getId());
        return userRepository.save(student);
    }

    public User unskipStudent(String studentId) {
        Round round = roundRepository.findTopByOrderByCreatedAtDesc()
            .orElseThrow(() -> new RuntimeException("No active round"));
        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        if (student.getSkippedInRounds() != null)
            student.getSkippedInRounds().remove(round.getId());
        return userRepository.save(student);
    }

    // ── Round Summary ─────────────────────────────────────────────────────────

    public Map<String, Object> getRoundSummary() {
        Round currentRound = roundRepository.findTopByOrderByCreatedAtDesc().orElse(null);
        Map<String, Object> result = new HashMap<>();
        if (currentRound == null) {
            result.put("currentRound", null);
            result.put("allocatedThisRound", List.of());
            result.put("remainingStudents", List.of());
            result.put("skippedStudents", List.of());
            return result;
        }
        String roundId = currentRound.getId();
        List<Allocation> allocatedThisRound = allocationRepository.findByRoundOrderByCreatedAtDesc(roundId)
            .stream().filter(a -> !"cancelled".equals(a.getStatus())).toList();

        List<User> allPending = userRepository.findPendingStudents();
        allPending.sort(Comparator
            .comparingDouble((User u) -> u.getMhtCetPercentile() != null ? -u.getMhtCetPercentile() : 0));

        List<User> skipped = allPending.stream()
            .filter(s -> s.getSkippedInRounds() != null && s.getSkippedInRounds().contains(roundId))
            .toList();
        List<User> remaining = allPending.stream()
            .filter(s -> s.getSkippedInRounds() == null || !s.getSkippedInRounds().contains(roundId))
            .toList();

        skipped.forEach(s -> s.setPassword(null));
        remaining.forEach(s -> s.setPassword(null));

        result.put("currentRound", currentRound);
        result.put("allocatedThisRound", allocatedThisRound);
        result.put("remainingStudents", remaining);
        result.put("skippedStudents", skipped);
        return result;
    }

    // ── CSV Export ────────────────────────────────────────────────────────────

    public String exportCsv(String roundId) {
        List<Allocation> allocations = roundId != null
            ? allocationRepository.findByRoundAndStatusNot(roundId, "cancelled")
            : allocationRepository.findByStatusNot("cancelled");

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss")
            .withZone(ZoneId.of("Asia/Kolkata"));

        StringBuilder sb = new StringBuilder();
        sb.append("Sr No,Application ID,Full Name,Email,Phone,MHT-CET Percentile,MHT-CET Score,JEE Main Percentile,")
          .append("Category,Gender,Student Type,Is PWD,Is DEF,Is Orphan,Is Minority,")
          .append("Branch Code,Branch Name,Branch Type,Seat Category,Seat Type,Seat Pool,")
          .append("Allocation Method,Round Name,Round Number,Status,Allocated At\n");

        int idx = 1;
        for (Allocation a : allocations) {
            User s = a.getStudent() != null ? userRepository.findById(a.getStudent()).orElse(new User()) : new User();
            Branch b = a.getBranch() != null ? branchRepository.findById(a.getBranch()).orElse(new Branch()) : new Branch();
            Round r = a.getRound() != null ? roundRepository.findById(a.getRound()).orElse(new Round()) : new Round();

            sb.append(idx++).append(",")
              .append(esc(s.getApplicationId())).append(",")
              .append(esc(s.getFullName())).append(",")
              .append(esc(s.getEmail())).append(",")
              .append(esc(s.getPhone())).append(",")
              .append(nvl(s.getMhtCetPercentile())).append(",")
              .append(nvl(s.getMhtCetScore())).append(",")
              .append(nvl(s.getJeeMainPercentile())).append(",")
              .append(esc(s.getCategory())).append(",")
              .append(esc(s.getGender())).append(",")
              .append(esc(s.getStudentType())).append(",")
              .append(bool(s.getIsPWD())).append(",")
              .append(bool(s.getIsDEF())).append(",")
              .append(bool(s.getIsOrphan())).append(",")
              .append(bool(s.getIsMinority())).append(",")
              .append(esc(b.getChoiceCode())).append(",")
              .append(esc(b.getName())).append(",")
              .append(esc(b.getType())).append(",")
              .append(esc(a.getSeatCategory())).append(",")
              .append(esc(a.getSeatType())).append(",")
              .append(esc(a.getSeatPool())).append(",")
              .append(esc(a.getAllocatedBy())).append(",")
              .append(esc(r.getName())).append(",")
              .append(r.getRoundNumber()).append(",")
              .append(esc(a.getStatus())).append(",")
              .append(a.getCreatedAt() != null ? fmt.format(a.getCreatedAt()) : "")
              .append("\n");
        }
        return sb.toString();
    }

    private String esc(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n"))
            return "\"" + val.replace("\"", "\"\"") + "\"";
        return val;
    }
    private String nvl(Double d) { return d != null ? String.valueOf(d) : "0"; }
    private String bool(Boolean b) { return Boolean.TRUE.equals(b) ? "Yes" : "No"; }

    // ── Broadcast helpers ─────────────────────────────────────────────────────

    private void broadcastSeatUpdate(Branch branch) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("branchId", branch.getId());
        payload.put("branch", branch);
        payload.put("updatedAt", Instant.now());
        messagingTemplate.convertAndSend("/topic/seat-update", payload);
    }

    private void broadcastAllocationUpdate(String studentId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("studentId", studentId);
        payload.put("updatedAt", Instant.now());
        messagingTemplate.convertAndSend("/topic/allocation-update", payload);
    }

    private User sanitize(User u) { u.setPassword(null); return u; }

    // ── Inner record ──────────────────────────────────────────────────────────

    private record SeatAttempt(String pool, String cat, String type, String label) {}
}


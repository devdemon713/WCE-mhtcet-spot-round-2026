package com.wce.acap.service;

import com.wce.acap.model.Branch;
import com.wce.acap.model.CategorySlot;
import com.wce.acap.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<Branch> getAllBranches(String type) {
        List<Branch> branches = (type != null && !type.isEmpty())
            ? branchRepository.findByIsActiveAndTypeOrderByChoiceCodeAsc(true, type)
            : branchRepository.findByIsActiveOrderByChoiceCodeAsc(true);
        branches.forEach(this::populateVirtuals);
        return branches;
    }

    public Branch getBranchById(String id) {
        Branch branch = branchRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Branch not found"));
        populateVirtuals(branch);
        return branch;
    }

    public Branch updateBranch(String id, Map<String, Object> updates) {
        Branch branch = branchRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Branch not found"));

        // Apply simple scalar updates
        if (updates.containsKey("ewsSeats")) branch.setEwsSeats(toInt(updates.get("ewsSeats")));
        if (updates.containsKey("orphanSeats")) branch.setOrphanSeats(toInt(updates.get("orphanSeats")));
        if (updates.containsKey("minoritySeats")) branch.setMinoritySeats(toInt(updates.get("minoritySeats")));
        if (updates.containsKey("allIndiaSeats")) branch.setAllIndiaSeats(toInt(updates.get("allIndiaSeats")));
        if (updates.containsKey("instituteSeats")) branch.setInstituteSeats(toInt(updates.get("instituteSeats")));
        if (updates.containsKey("pwdCommonReserved")) branch.setPwdCommonReserved(toInt(updates.get("pwdCommonReserved")));
        if (updates.containsKey("defCommonReserved")) branch.setDefCommonReserved(toInt(updates.get("defCommonReserved")));
        if (updates.containsKey("isActive")) branch.setActive((Boolean) updates.get("isActive"));
        if (updates.containsKey("stateLevel")) branch.setStateLevel(parseCategoryMap(updates.get("stateLevel")));
        if (updates.containsKey("pwd")) branch.setPwd(parseCategoryMap(updates.get("pwd")));
        if (updates.containsKey("def")) branch.setDef(parseCategoryMap(updates.get("def")));

        branch = branchRepository.save(branch);
        populateVirtuals(branch);
        broadcastSeatUpdate(branch);
        return branch;
    }

    public Branch resetBranchSeats(String id) {
        Branch branch = branchRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Branch not found"));

        branch.setStateLevel(Branch.defaultCategories());
        branch.setPwd(Branch.defaultCategories());
        branch.setDef(Branch.defaultCategories());
        branch.setPwdCommonReserved(0);
        branch.setDefCommonReserved(0);
        branch.setEwsSeats(0);
        branch.setAllIndiaSeats(0);
        branch.setInstituteSeats(0);
        branch.setOrphanSeats(0);
        branch.setMinoritySeats(0);

        branch = branchRepository.save(branch);
        populateVirtuals(branch);
        broadcastSeatUpdate(branch);
        return branch;
    }

    public List<Branch> resetAllSeats() {
        List<Branch> all = branchRepository.findAll();
        for (Branch branch : all) {
            branch.setStateLevel(Branch.defaultCategories());
            branch.setPwd(Branch.defaultCategories());
            branch.setDef(Branch.defaultCategories());
            branch.setPwdCommonReserved(0);
            branch.setDefCommonReserved(0);
            branch.setEwsSeats(0);
            branch.setAllIndiaSeats(0);
            branch.setInstituteSeats(0);
            branch.setOrphanSeats(0);
            branch.setMinoritySeats(0);
        }
        List<Branch> saved = branchRepository.saveAll(all);
        saved.forEach(this::populateVirtuals);

        Map<String, Object> payload = new HashMap<>();
        payload.put("branches", saved);
        payload.put("updatedAt", Instant.now());
        messagingTemplate.convertAndSend("/topic/seats-reset", payload);
        return saved;
    }

    public void populateVirtuals(Branch branch) {
        branch.setTotalVacant(branch.computeTotalVacant());
        branch.setStateLevelTotal(branch.computeStateLevelTotal());
    }

    public void broadcastSeatUpdate(Branch branch) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("branchId", branch.getId());
        payload.put("branch", branch);
        payload.put("updatedAt", Instant.now());
        messagingTemplate.convertAndSend("/topic/seat-update", payload);
    }

    @SuppressWarnings("unchecked")
    private Map<String, CategorySlot> parseCategoryMap(Object obj) {
        if (!(obj instanceof Map)) return Branch.defaultCategories();
        Map<String, Object> raw = (Map<String, Object>) obj;
        Map<String, CategorySlot> result = new HashMap<>();
        for (Map.Entry<String, Object> e : raw.entrySet()) {
            if (e.getValue() instanceof Map) {
                Map<String, Object> slot = (Map<String, Object>) e.getValue();
                CategorySlot cs = new CategorySlot();
                cs.setGeneral(toInt(slot.getOrDefault("general", 0)));
                cs.setLadies(toInt(slot.getOrDefault("ladies", 0)));
                result.put(e.getKey(), cs);
            }
        }
        return result;
    }

    private int toInt(Object val) {
        if (val == null) return 0;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return 0; }
    }
}


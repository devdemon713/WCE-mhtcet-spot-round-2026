package com.wce.acap.dto;

import lombok.Data;

@Data
public class UpgradeAllocationRequest {
    private String studentId;
    private String fromBranchId;
    private String fromSeatPool;
    private String fromSeatCategory;
    private String fromSeatType;
    private String toBranchId;
    private String toSeatPool;
    private String toSeatCategory;
    private String toSeatType;
}


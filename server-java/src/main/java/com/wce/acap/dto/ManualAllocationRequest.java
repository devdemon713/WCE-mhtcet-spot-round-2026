package com.wce.acap.dto;

import lombok.Data;

@Data
public class ManualAllocationRequest {
    private String studentId;
    private String branchId;
    private String seatCategory;
    private String seatType;
    private String seatPool;
}


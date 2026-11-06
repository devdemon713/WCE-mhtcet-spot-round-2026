package com.wce.acap.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserPayload user;

    @Data
    @AllArgsConstructor
    public static class UserPayload {
        private String id;
        private String applicationId;
        private String fullName;
        private String email;
        private String phone;
        private String photo;
        private String role;
        private String studentType;
        private String wceMeritNumber;
        private Integer stateMeritNumber;
        private String category;
        private String gender;
        private Boolean isPWD;
        private Boolean isDEF;
        private Boolean isOrphan;
        private Boolean isMinority;
        private Double mhtCetPercentile;
        private Double mathPercentile;
        private Double physicsPercentile;
        private Double chemistryPercentile;
        private Double hscPercentage;
        private String allocationStatus;
        private String allocatedBranch;
        private String allocatedSeatCategory;
        private String allocatedSeatType;
    }
}


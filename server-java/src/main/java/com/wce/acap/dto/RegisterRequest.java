package com.wce.acap.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String applicationId;
    @NotBlank private String fullName;
    @Email @NotBlank private String email;
    @NotBlank private String password;
    @NotBlank private String phone;
    @NotBlank private String gender;
    @NotBlank private String category;
    @NotNull  private Double mhtCetPercentile;
    @NotBlank private String studentType;

    // Optional
    private Boolean isPWD;
    private Boolean isDEF;
    private Boolean isOrphan;
    private Boolean isMinority;
    private Double mhtCetScore;
    private Double jeeMainPercentile;
    private Double mathPercentile;
    private Double physicsPercentile;
    private Double chemistryPercentile;
    private Double hscPercentage;
    private Double sscAggregate;
    private Double diplomaPercentage;
    private String wceMeritNumber;
    private Integer stateMeritNumber;
}


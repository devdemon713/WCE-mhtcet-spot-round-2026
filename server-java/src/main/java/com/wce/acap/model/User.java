package com.wce.acap.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String applicationId;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    private String password;
    private String phone;
    private String photo;

    private String wceMeritNumber;
    private Integer stateMeritNumber;

    private String category = "OPEN";
    private String gender;

    private Boolean isPWD = false;
    private Boolean isDEF = false;
    private Boolean isOrphan = false;
    private Boolean isMinority = false;

    private Double mhtCetPercentile = 0.0;
    private Double mhtCetScore = 0.0;
    private Double jeeMainPercentile = 0.0;
    private Double mathPercentile = 0.0;
    private Double physicsPercentile = 0.0;
    private Double chemistryPercentile = 0.0;
    private Double hscPercentage = 0.0;
    private Double sscAggregate = 0.0;
    private Double sscMaths = 0.0;
    private Double sscScience = 0.0;
    private Double sscEnglish = 0.0;
    private Double diplomaPercentage = 0.0;

    private String studentType = "CAP";
    private String role = "student";

    private String allocationStatus = "pending";
    private String allocatedBranch;
    private String allocatedSeatCategory;
    private String allocatedSeatType;
    private String allocatedSeatPool;

    private List<String> skippedInRounds = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}


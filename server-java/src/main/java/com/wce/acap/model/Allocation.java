package com.wce.acap.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@Document(collection = "allocations")
public class Allocation {

    @Id
    private String id;

    private String student;   // User ObjectId
    private String branch;    // Branch ObjectId
    private String seatCategory;
    private String seatType;  // general / ladies
    private String seatPool;  // stateLevel / pwd / def / ewsSeats / ...
    private String allocatedBy; // manual / auto / upgrade
    private String upgradeFromBranch;
    private String allocatedByAdmin;
    private String round;
    private String status = "allocated"; // allocated / confirmed / cancelled

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}


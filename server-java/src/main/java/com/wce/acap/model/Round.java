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
@Document(collection = "rounds")
public class Round {

    @Id
    private String id;

    private String name = "ACAP Round 2025-26";
    private String status = "demo"; // demo / setup / active / paused / completed
    private boolean isDemo = true;
    private String description = "Demo round with sample data";

    private String announcementText = "THIS FORM IS ONLY FOR STUDENTS APPLYING FOR 1ST YEAR ACAP ROUND REGISTRATION";
    private boolean announcementEnabled = true;
    private String announcementDirection = "ltr";

    private Instant startedAt;
    private Instant endedAt;

    private int totalSeatsInitial = 0;
    private int totalSeatsAllocated = 0;
    private int roundNumber = 1;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}


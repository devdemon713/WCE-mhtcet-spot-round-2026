package com.wce.acap.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@Document(collection = "branches")
public class Branch {

    @Id
    private String id;

    @Indexed(unique = true)
    private String choiceCode;

    private String name;
    private String type; // Aided / Unaided
    private int sanctionedIntake;

    private int msSeats = 0;
    private int minoritySeats = 0;
    private int allIndiaSeats = 0;
    private int instituteSeats = 0;
    private int orphanSeats = 0;

    // Category-wise seats: key = OPEN, SC, ST, VJ_DT, NTB, NTC, NTD, OBC, SEBC
    private Map<String, CategorySlot> stateLevel = defaultCategories();
    private Map<String, CategorySlot> pwd = defaultCategories();
    private Map<String, CategorySlot> def = defaultCategories();

    private int pwdCommonReserved = 0;
    private int defCommonReserved = 0;
    private int ewsSeats = 0;
    private String tfwsChoiceCode = "";
    private int tfwsSeats = 0;

    private boolean isActive = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    // Computed field — not stored in DB
    @Transient
    private int totalVacant;

    @Transient
    private int stateLevelTotal;

    public int computeTotalVacant() {
        int total = 0;
        total += sumCategoryMap(stateLevel);
        total += sumCategoryMap(pwd);
        total += sumCategoryMap(def);
        total += pwdCommonReserved + defCommonReserved + ewsSeats
               + allIndiaSeats + instituteSeats + orphanSeats + minoritySeats;
        return total;
    }

    public int computeStateLevelTotal() {
        return sumCategoryMap(stateLevel);
    }

    private static int sumCategoryMap(Map<String, CategorySlot> map) {
        if (map == null) return 0;
        return map.values().stream()
            .mapToInt(s -> s.getGeneral() + s.getLadies())
            .sum();
    }

    public static Map<String, CategorySlot> defaultCategories() {
        Map<String, CategorySlot> m = new HashMap<>();
        for (String cat : new String[]{"OPEN","SC","ST","VJ_DT","NTB","NTC","NTD","OBC","SEBC"}) {
            m.put(cat, new CategorySlot());
        }
        return m;
    }
}


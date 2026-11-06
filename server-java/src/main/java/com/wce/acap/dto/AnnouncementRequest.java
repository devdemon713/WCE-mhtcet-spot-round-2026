package com.wce.acap.dto;

import lombok.Data;

@Data
public class AnnouncementRequest {
    private String announcementText;
    private Boolean announcementEnabled;
    private String announcementDirection;
    private Boolean resetToDefault;
}


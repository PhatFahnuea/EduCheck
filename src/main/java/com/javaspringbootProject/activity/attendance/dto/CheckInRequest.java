package com.javaspringbootProject.activity.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class CheckInRequest {
    private Long enrollmentId;
    private String token;
    private Double lat;
    private Double lng;
    private String method; // "QR" | "GEO"
}

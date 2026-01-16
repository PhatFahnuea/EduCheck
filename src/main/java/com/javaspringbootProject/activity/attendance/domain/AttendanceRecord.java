package com.javaspringbootProject.activity.attendance.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor
public class AttendanceRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    private com.javaspringbootProject.activity.course.domain.Enrollment enrollment;
    private LocalDate date;
    @Enumerated(EnumType.STRING)
    private AttendanceMethod method;
    private LocalTime checkInTime;
    private boolean present;
    private  String token;
    private  String locationInfo;
}

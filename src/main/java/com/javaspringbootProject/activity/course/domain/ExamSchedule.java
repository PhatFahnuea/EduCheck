package com.javaspringbootProject.activity.course.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor
public class ExamSchedule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private CourseSection courseSection;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 1024)
    private String description;

    @Column(nullable = false)
    private LocalDateTime examAt;     // วัน/เวลาเริ่มสอบ

    @Column(nullable = false)
    private Integer durationMinutes;  // ระยะเวลาสอบ (นาที)

    @Column(length = 255)
    private String location;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

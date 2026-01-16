// src/main/java/com/javaspringbootProject/activity/attendance/domain/Absence.java
package com.javaspringbootProject.activity.attendance.domain;

import com.javaspringbootProject.activity.course.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "absence") // ใช้ตารางเดียว รวมทุกคอร์ส/เซคชัน
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Absence {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ผู้ยื่นลา (นักศึกษา) */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    /** tag ไว้เฉย ๆ (nullable) – ไม่ทำ FK เพื่อความยืดหยุ่น */
    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "section_id")
    private Long sectionId;

    /** วันที่ลา (ถ้าลาหลายวัน แนะนำสร้างหลายเอกสาร) */
    @Column(nullable = false)
    private LocalDate date;

    /** ช่วงเวลา (ไม่บังคับ) */
    @Column(name = "period_start", length = 16)
    private String periodStart; // "09:00"

    @Column(name = "period_end", length = 16)
    private String periodEnd;   // "12:00"

    @Column(columnDefinition = "text")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(length = 16, nullable = false)
    private AbsenceStatus status = AbsenceStatus.PENDING;

    @Column(columnDefinition = "text")
    private String reviewerNote;

    /** ผู้ตรวจ (ไม่บังคับ) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    /** ไฟล์แนบหลายไฟล์ */
    @ElementCollection
    @CollectionTable(name = "absence_attachments", joinColumns = @JoinColumn(name = "absence_id"))
    @Column(name = "file_url", length = 1000)
    private List<String> attachments = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;
    private Instant reviewedAt;

    @PrePersist
    void prePersist() {
        var now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}

package com.javaspringbootProject.activity.section.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "section_staff",
        uniqueConstraints = @UniqueConstraint(columnNames = {"section_id", "user_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SectionStaff {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_id", nullable = false)
    private Long sectionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // บทบาทภายใน section (เช่น TA/GRADER) – ไม่ใช่ users.role
    @Column(name = "section_role", nullable = false, length = 20)
    private String sectionRole; // "TA", "GRADER", "LECTURER"...

    // เก็บ permission แบบ CSV หรือ JSON ก็ได้ — ที่นี่ใช้ CSV เรียบง่าย
    @Column(name = "permissions", length = 255)
    private String permissionsCsv; // เช่น "grade:read,grade:write"

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public SectionStaff(Long sectionId, Long userId, String sectionRole, String permissionsCsv) {
        this.sectionId = sectionId;
        this.userId = userId;
        this.sectionRole = sectionRole;
        this.permissionsCsv = permissionsCsv;
    }
}

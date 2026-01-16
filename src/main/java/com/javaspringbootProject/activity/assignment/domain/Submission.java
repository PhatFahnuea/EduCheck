package com.javaspringbootProject.activity.assignment.domain;

import com.javaspringbootProject.activity.course.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "submissions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_submission_assignment_student",
                columnNames = {"assignment_id", "student_id"}
        )
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Submission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id")
    private Assignment assignment;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    /** (Legacy) ถ้าต้องการเก็บลิงก์เดียวไว้เข้ากันย้อนหลัง */
    @Column(length = 1000)
    private String submissionLink;

    /** แนบได้หลายไฟล์ */
    @ElementCollection
    @CollectionTable(
            name = "submission_attachments",
            joinColumns = @JoinColumn(name = "submission_id")
    )
    @Column(name = "file_url", length = 1000)
    private List<String> attachments = new ArrayList<>();

    @Column(columnDefinition = "text")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private SubmissionStatus status = SubmissionStatus.DRAFT; // เริ่มเป็นร่าง

    private Double score;

    @Column(columnDefinition = "text")
    private String feedback;

    private Instant createdAt;
    private Instant updatedAt;
    private Instant submittedAt;

    @PrePersist
    void prePersist() {
        var now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        // ตั้ง submittedAt เฉพาะกรณีส่งจริง
        if (status == SubmissionStatus.SUBMITTED && submittedAt == null) {
            submittedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
        // ถ้า unsubmit ให้ลบเวลาส่ง
        if (status != SubmissionStatus.SUBMITTED) {
            submittedAt = null;
        } else if (submittedAt == null) {
            submittedAt = updatedAt;
        }
    }
}

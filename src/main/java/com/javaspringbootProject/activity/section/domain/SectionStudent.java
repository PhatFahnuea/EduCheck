package com.javaspringbootProject.activity.section.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "section_student",
        uniqueConstraints = @UniqueConstraint(name="uk_section_student", columnNames = {"section_id","student_id"})
)
@Getter @Setter @NoArgsConstructor
public class SectionStudent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_id", nullable = false)
    private Long sectionId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    public SectionStudent(Long sectionId, Long studentId) {
        this.sectionId = sectionId;
        this.studentId = studentId;
    }
}
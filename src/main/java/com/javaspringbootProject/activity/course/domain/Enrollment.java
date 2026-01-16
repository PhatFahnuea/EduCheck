package com.javaspringbootProject.activity.course.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor
public class Enrollment {
    @Id
    @GeneratedValue
    private Long id;
    @ManyToOne
    private User student;
    @ManyToOne
    private CourseSection courseSection;
    private String studentNumber;
    @Enumerated(EnumType.STRING)
    private EnrollmentStatus status;
}

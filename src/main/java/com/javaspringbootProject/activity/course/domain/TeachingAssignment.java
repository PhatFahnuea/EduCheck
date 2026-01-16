package com.javaspringbootProject.activity.course.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeachingAssignment {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private User ta;

    @ManyToOne
    private CourseSection courseSection;

    // เก็บ permission เป็น comma separated หรือ JSON; ตัวอย่างนี้ใช้ String
    private String permissions; // ex "ASSIGNMENT,ATTENDANCE"
}

package com.javaspringbootProject.activity.course.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Data @NoArgsConstructor
@AllArgsConstructor
public class Course {
    @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false, length = 64)
    private String code;
    @Column(nullable = false, length = 255)
    private String title;
    @Column(length = 512)
    private String img;
    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;
}

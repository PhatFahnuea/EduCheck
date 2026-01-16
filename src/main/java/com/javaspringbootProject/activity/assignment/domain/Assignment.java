package com.javaspringbootProject.activity.assignment.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor
public class Assignment {
    @Id @GeneratedValue
    private Long id;

    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDateTime dueDate;
    private Double maxScore;

    @ManyToOne(optional = false)
    private com.javaspringbootProject.activity.course.domain.CourseSection courseSection;

    // ——— เพิ่มเติม ———
    @ElementCollection
    @CollectionTable(name = "assignment_links", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "url", length = 1024)
    private List<String> resourceLinks = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "assignment_attachments", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "file_url", length = 1024)
    private List<String> attachmentUrls = new ArrayList<>();
}

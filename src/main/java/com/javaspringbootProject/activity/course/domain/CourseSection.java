package com.javaspringbootProject.activity.course.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data @NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "course_section",
        uniqueConstraints = @UniqueConstraint(
                name = "ux_course_term_sec",
                columnNames = {"course_id","term","section_no"}
        )
)
public class CourseSection {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String sectionCode;
    private String semester;
    private LocalDate startDate;
    private LocalDate endDate;
    @ManyToOne
    private User owner;

    @ManyToOne(optional = false)
    private Course course;

    @Column(nullable = false)
    private Integer sectionNo;

    @Column(name = "term", nullable = false, length = 16)
    private String term;

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<CourseSectionSchedule> schedules = new ArrayList<>();

    public void setSchedules(List<CourseSectionSchedule> schedules) {
        this.schedules.clear();
        if (schedules != null) {
            for (CourseSectionSchedule s : schedules) {
                s.setSection(this); // sync ฝั่งลูก
                this.schedules.add(s);
            }
        }
    }
}

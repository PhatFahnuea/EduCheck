
package com.javaspringbootProject.activity.course.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "course_section_schedule")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseSectionSchedule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ผูกกับ Section */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private CourseSection section;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", length = 16, nullable = false)
    private Weekday dayOfWeek;             // MONDAY..SUNDAY

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;           // 09:00

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;             // 10:30

    @Column(name = "location", length = 255)
    private String location;               // ไม่บังคับ
}

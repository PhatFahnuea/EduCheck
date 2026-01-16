package com.javaspringbootProject.activity.section.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class SectionStatDto {
    // course
    private Long   courseId;
    private String courseCode;
    private String courseTitle;

    // section
    private Long   sectionId;
    private Integer sectionNo;
    private String  term;

    // metric
    private Long studentCount;
}

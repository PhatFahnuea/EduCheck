package com.javaspringbootProject.activity.course.dto;

import java.time.LocalDateTime;

public record ExamCardDto(
        Long id,
        String title,
        String courseCode,
        String courseTitle,
        Integer sectionNo,
        String term,
        LocalDateTime examDateTime,
        String location
) {
}

package com.javaspringbootProject.activity.course.service;

import com.javaspringbootProject.activity.course.domain.CourseSection;
import com.javaspringbootProject.activity.course.domain.User;
import com.javaspringbootProject.activity.integration.excel.ExcelImportService;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;

public interface CourseSectionService {
    CourseSection getById(Long id);
    void assignTa(Long id, Long taId, java.util.Set<String> permissions, Long operatorId);
    List<User> importStudentsFromExcel(long sectionId, InputStream excelStream, Long operatorId);

    CourseSection createSection(Long courseId, Integer sectionNo, String term,
                                LocalDate startDate, LocalDate endDate, Long ownerId);

    // NEW (option): รองรับ schedules
    CourseSection createSection(Long courseId, Integer sectionNo, String term,
                                LocalDate startDate, LocalDate endDate, Long ownerId,
                                List<com.javaspringbootProject.activity.course.web.CourseSectionController.ScheduleReq> schedules);
}
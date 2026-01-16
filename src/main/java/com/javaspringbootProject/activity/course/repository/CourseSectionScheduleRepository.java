// src/main/java/com/javaspringbootProject/activity/course/repository/CourseSectionScheduleRepository.java
package com.javaspringbootProject.activity.course.repository;

import com.javaspringbootProject.activity.course.domain.CourseSectionSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseSectionScheduleRepository extends JpaRepository<CourseSectionSchedule, Long> { }

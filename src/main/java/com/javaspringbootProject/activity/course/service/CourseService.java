package com.javaspringbootProject.activity.course.service;

import com.javaspringbootProject.activity.course.domain.Course;

import java.util.List;

public interface CourseService {
    Course createCourse(String code, String title, String description, String imgPath, Long ownerId);
    List<Course> listMine(Long ownerId);
}

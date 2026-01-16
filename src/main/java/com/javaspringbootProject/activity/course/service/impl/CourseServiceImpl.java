package com.javaspringbootProject.activity.course.service.impl;

import com.javaspringbootProject.activity.course.domain.Course;
import com.javaspringbootProject.activity.course.domain.User;
import com.javaspringbootProject.activity.course.repository.CourseRepository;
import com.javaspringbootProject.activity.course.repository.UserRepository;
import com.javaspringbootProject.activity.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {
    private final CourseRepository courseRepo;
    private final UserRepository userRepo;

    @Override
    public Course createCourse(String code, String title, String description, String imgPath, Long ownerId) {
        if (courseRepo.existsByCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Course code already exists");
        }
        User owner = userRepo.findById(ownerId).orElseThrow();
        Course c = new Course();
        c.setCode(code);
        c.setTitle(title);
        c.setDescription(description);
        c.setImg(imgPath);  // เก็บ path
        return courseRepo.save(c);
    }

    @Override
    public List<Course> listMine(Long ownerId) {
        return courseRepo.findAll();
    }
}

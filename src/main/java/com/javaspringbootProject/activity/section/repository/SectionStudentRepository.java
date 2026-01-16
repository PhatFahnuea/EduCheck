package com.javaspringbootProject.activity.section.repository;

import com.javaspringbootProject.activity.course.domain.User;
import com.javaspringbootProject.activity.section.domain.SectionStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SectionStudentRepository extends JpaRepository<SectionStudent, Long> {
    boolean existsBySectionIdAndStudentId(Long sectionId, Long studentId);
    long countBySectionId(Long sectionId);

    @Query("""
        select u from com.javaspringbootProject.activity.course.domain.User u
        where u.id in (
            select ss.studentId from com.javaspringbootProject.activity.section.domain.SectionStudent ss
            where ss.sectionId = :sectionId
        )
        """)
    List<User> findUsersBySectionId(Long sectionId);
    List<SectionStudent> findByStudentId(Long studentId);
}
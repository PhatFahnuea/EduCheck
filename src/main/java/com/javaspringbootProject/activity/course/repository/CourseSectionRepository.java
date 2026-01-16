package com.javaspringbootProject.activity.course.repository;

import com.javaspringbootProject.activity.course.domain.CourseSection;
import com.javaspringbootProject.activity.section.dto.SectionStatDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {
    Optional<CourseSection> findByIdAndOwnerId(Long courseSectionId, Long ownerId);
    Optional<CourseSection> findByCourseIdAndTermAndSectionNo(Long courseId, String term, Integer sectionNo);
    List<CourseSection> findByCourseId(Long courseId);
    boolean existsByCourseIdAndTermAndSectionNo(Long courseId, String term, Integer sectionNo);
    @Query("""
        select cs from CourseSection cs
        join fetch cs.course c
        """)
    List<CourseSection> findAllWithCourse();
    @Query("""
        select new com.javaspringbootProject.activity.section.dto.SectionStatDto(
            c.id, c.code, c.title,
            s.id, s.sectionNo, s.term,
            (select count(ss) from com.javaspringbootProject.activity.section.domain.SectionStudent ss
                where ss.sectionId = s.id)
        )
        from com.javaspringbootProject.activity.course.domain.CourseSection s
        join s.course c
        order by c.code asc, s.sectionNo asc
        """)
    List<SectionStatDto> findSectionStats();
}

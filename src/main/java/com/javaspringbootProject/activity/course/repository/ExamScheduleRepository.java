package com.javaspringbootProject.activity.course.repository;

import com.javaspringbootProject.activity.course.domain.ExamSchedule;
import com.javaspringbootProject.activity.course.dto.ExamCardDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ExamScheduleRepository extends JpaRepository<ExamSchedule, Long> {
    List<ExamSchedule> findByCourseSectionIdOrderByExamAtAsc(Long sectionId);

    @Query("""
        select new com.javaspringbootProject.activity.course.dto.ExamCardDto(
            e.id, e.title, c.code, c.title, s.sectionNo, s.term, e.examAt, e.location
        )
        from ExamSchedule e
        join e.courseSection s
        join s.course c
        where (:from is null or e.examAt >= :from)
        order by e.examAt asc
    """)
    List<ExamCardDto> findAllCards(LocalDateTime from);

    @Query("""
        select new com.javaspringbootProject.activity.course.dto.ExamCardDto(
            e.id, e.title, c.code, c.title, s.sectionNo, s.term, e.examAt, e.location
        )
        from ExamSchedule e
        join e.courseSection s
        join s.course c
        where s.owner.id = :ownerId
          and (:from is null or e.examAt >= :from)
        order by e.examAt asc
    """)
    List<ExamCardDto> findCardsByOwner(@Param("ownerId") Long ownerId,
                                       @Param("from") LocalDateTime from);
}


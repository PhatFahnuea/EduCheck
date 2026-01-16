// src/main/java/com/javaspringbootProject/activity/course/web/ExamQueryController.java
package com.javaspringbootProject.activity.course.web;

import com.javaspringbootProject.activity.common.dto.ApiResponse;
import com.javaspringbootProject.activity.course.domain.ExamSchedule;
import com.javaspringbootProject.activity.course.dto.ExamCardDto;
import com.javaspringbootProject.activity.course.repository.ExamScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/v1/exams")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // dev only
public class ExamQueryController {

    private final ExamScheduleRepository examRepo;

    // /api/v1/exams?upcoming=true&limit=5
    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(value="upcoming", required=false) Boolean upcoming,
            @RequestParam(value="limit", required=false) Integer limit
    ) {
        LocalDateTime from = (upcoming != null && upcoming) ? LocalDateTime.now() : null;
        List<ExamCardDto> items = examRepo.findAllCards(from);
        if (limit != null && limit > 0 && items.size() > limit) {
            items = items.subList(0, limit);
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", items));
    }

    // ถ้ายังไม่ทำระบบ owner/mine ให้คงไว้แบบว่างๆ เพื่อลด error จาก frontend ที่เรียก /exams/mine
    @GetMapping("/mine")
    public ResponseEntity<?> mine(
            @RequestParam(value="upcoming", required=false) Boolean upcoming,
            @RequestParam(value="limit", required=false) Integer limit
    ) {
        // ยังไม่มี owner ก็ใช้รวมไปก่อน
        return list(upcoming, limit);
    }
}

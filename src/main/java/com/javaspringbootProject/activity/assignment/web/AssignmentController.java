package com.javaspringbootProject.activity.assignment.web;

import com.javaspringbootProject.activity.assignment.domain.Assignment;
import com.javaspringbootProject.activity.assignment.dto.CreateAssignmentReq;
import com.javaspringbootProject.activity.assignment.repository.AssignmentRepository;
import com.javaspringbootProject.activity.common.dto.ApiResponse;
import com.javaspringbootProject.activity.course.repository.CourseSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AssignmentController {

    private final CourseSectionRepository courseSectionRepo;
    private final AssignmentRepository assignmentRepo;

    @PostMapping("/sections/{sectionId}/assignments")
    public ApiResponse<?> create(
            @PathVariable Long sectionId,
            @RequestBody CreateAssignmentReq req
    ){
        var section = courseSectionRepo.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found"));

        var a = new Assignment();
        a.setCourseSection(section);
        a.setTitle(req.title());
        a.setDescription(req.description());
        a.setDueDate(req.dueDate());
        a.setMaxScore(req.maxScore());
        // ถ้ามีฟิลด์ลิสต์ด้านล่างใน entity (ใส่ @ElementCollection ด้วย)
        a.setResourceLinks(Optional.ofNullable(req.links()).orElseGet(List::of));
        a.setAttachmentUrls(Optional.ofNullable(req.attachments()).orElseGet(List::of));

        a = assignmentRepo.save(a);
        return new ApiResponse<>(true, "Created", a);
    }

    @GetMapping("/sections/{sectionId}/assignments")
    public ApiResponse<?> list(@PathVariable Long sectionId) {
        var items = assignmentRepo.findByCourseSection_Id(sectionId);
        return new ApiResponse<>(true, "OK", items);
    }

    @GetMapping("/assignments/{id}")
    public ApiResponse<?> getOne(@PathVariable Long id){
        var a = assignmentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        return new ApiResponse<>(true, "OK", a);
    }

    @PutMapping("/assignments/{id}")
    public ApiResponse<?> update(
            @PathVariable Long id,
            @RequestBody CreateAssignmentReq req
    ){
        var a = assignmentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));

        if (req.title() != null)        a.setTitle(req.title());
        if (req.description() != null)  a.setDescription(req.description());
        if (req.dueDate() != null)      a.setDueDate(req.dueDate());
        if (req.maxScore() != null)     a.setMaxScore(req.maxScore());
        if (req.links() != null)        a.setResourceLinks(req.links());
        if (req.attachments() != null)  a.setAttachmentUrls(req.attachments());

        a = assignmentRepo.save(a);
        return new ApiResponse<>(true, "Updated", a);
    }

    @DeleteMapping("/assignments/{id}")
    public ApiResponse<?> delete(@PathVariable Long id){
        var a = assignmentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        assignmentRepo.delete(a);
        return new ApiResponse<>(true, "Deleted", null);
    }
}

package com.javaspringbootProject.activity.assignment.service.impl;

import com.javaspringbootProject.activity.assignment.domain.Assignment;
import com.javaspringbootProject.activity.assignment.dto.AssignmentResponse;
import com.javaspringbootProject.activity.assignment.dto.CreateAssignmentReq;
import com.javaspringbootProject.activity.assignment.repository.AssignmentRepository;
import com.javaspringbootProject.activity.common.exception.NotFoundException;
import com.javaspringbootProject.activity.course.domain.CourseSection;
import com.javaspringbootProject.activity.course.repository.CourseSectionRepository;
import com.javaspringbootProject.activity.course.service.PermissionService;
import com.javaspringbootProject.activity.assignment.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository repo;
    private final CourseSectionRepository courseSectionRepo;
    private final PermissionService permissionService;

    @Override
    @Transactional
    public Assignment createInSection(Long sectionId, CreateAssignmentReq req, Long creatorId) {
        CourseSection section = courseSectionRepo.findById(sectionId)
                .orElseThrow(() -> new NotFoundException("CourseSection not found"));

        // ตรวจสิทธิ์: เจ้าของ/อาจารย์ หรือ TA ของ section ที่มีสิทธิ์งาน
        boolean allowed = permissionService.isProfessorOwner(creatorId, section.getId())
                || permissionService.isTaOfSectionWith(creatorId, section.getId(), "assign:write");
        if (!allowed) {
            throw new IllegalArgumentException("No permission to create assignment in this section");
        }

        Assignment a = new Assignment();
        a.setCourseSection(section);
        a.setTitle(req.title());
        a.setDescription(req.description());
        a.setDueDate(req.dueDate());
        a.setMaxScore(req.maxScore() == null ? 100.0 : req.maxScore());

        // ถ้าใน Entity มี fields resourceLinks / attachmentUrls แบบ @ElementCollection
        a.setResourceLinks(req.links() == null ? new ArrayList<>() : new ArrayList<>(req.links()));
        a.setAttachmentUrls(req.attachments() == null ? new ArrayList<>() : new ArrayList<>(req.attachments()));

        return repo.save(a);
    }

    // ----- ส่วนเดิมคงไว้ได้ -----
    @Override
    public List<AssignmentResponse> getAllAssignments() {
        return repo.findAll().stream()
                .map(x -> new AssignmentResponse(
                        x.getId(), x.getTitle(), x.getDescription(), x.getDueDate()
                ))
                .toList();
    }

    @Override
    public AssignmentResponse getAssignmentById(Long id) {
        var a = repo.findById(id).orElseThrow(() -> new NotFoundException("Assignment not found with id: " + id));
        return new AssignmentResponse(a.getId(), a.getTitle(), a.getDescription(), a.getDueDate());
    }
}
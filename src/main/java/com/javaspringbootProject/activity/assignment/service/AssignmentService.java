package com.javaspringbootProject.activity.assignment.service;


import com.javaspringbootProject.activity.assignment.domain.Assignment;
import com.javaspringbootProject.activity.assignment.dto.AssignmentResponse;
import com.javaspringbootProject.activity.assignment.dto.CreateAssignmentReq;

import java.util.List;

public interface AssignmentService {
    Assignment createInSection(Long sectionId, CreateAssignmentReq req, Long creatorId);

    List<AssignmentResponse> getAllAssignments();     // ถ้ายังอยากมี
    AssignmentResponse getAssignmentById(Long id);    // ถ้ายังอยากมี
}
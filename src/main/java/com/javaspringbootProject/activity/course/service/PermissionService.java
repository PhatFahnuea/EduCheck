package com.javaspringbootProject.activity.course.service;

public interface PermissionService {
    boolean isProfessorOwner(Long userId, Long sectionId);
    boolean isTaOfSectionWith(Long taUserId, Long sectionId, String requiredPermission);
}

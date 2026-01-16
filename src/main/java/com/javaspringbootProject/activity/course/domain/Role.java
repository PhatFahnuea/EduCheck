package com.javaspringbootProject.activity.course.domain;

public enum Role {
    PROFESSOR, TA,STUDENT,ADMIN;


    public String getName() {
        return "ROLE_" + this.name();
    }
}

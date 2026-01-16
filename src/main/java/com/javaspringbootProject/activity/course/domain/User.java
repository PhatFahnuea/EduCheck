package com.javaspringbootProject.activity.course.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter @Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role; // STUDENT / TA / PROFESSOR

    @PrePersist
    void prePersistDefaults() {
        if (this.role == null) this.role = Role.STUDENT;  // default
        if (this.email != null) this.email = this.email.trim().toLowerCase();
        if (this.username != null) this.username = this.username.trim();
    }

    private String fullname;
    @Column(unique = true)
    private String email;

    @Column(name = "student_number")
    private String studentNumber;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}

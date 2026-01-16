package com.javaspringbootProject.activity.assignment.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradeRequest {
    @NotNull(message = "score is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "score must be >= 0")
    @DecimalMax(value = "100.0", inclusive = true, message = "score must be <= 100")
    private Double score;
    private String feedback;
}

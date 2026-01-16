
package com.javaspringbootProject.activity.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterTaRequest {
    @NotBlank private String username;
    @NotBlank private String password;
    @Email    private String email;
}

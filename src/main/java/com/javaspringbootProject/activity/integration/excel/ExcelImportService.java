package com.javaspringbootProject.activity.integration.excel;

import com.javaspringbootProject.activity.course.domain.User;

import java.io.InputStream;
import java.util.List;

public interface ExcelImportService {
    List<User> parseStudents(InputStream in);
}

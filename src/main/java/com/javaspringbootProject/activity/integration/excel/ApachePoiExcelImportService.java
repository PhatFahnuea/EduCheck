package com.javaspringbootProject.activity.integration.excel;

import com.javaspringbootProject.activity.course.domain.Role;
import com.javaspringbootProject.activity.course.domain.User;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ApachePoiExcelImportService implements ExcelImportService {

    @Override
    public List<User> parseStudents(InputStream in) {
        List<User> outs = new ArrayList<>();
        DataFormatter f = new DataFormatter();

        try (Workbook wb = new XSSFWorkbook(in)) {
            Sheet sheet = wb.getSheetAt(0);

            // map หัวคอลัมน์แบบยืดหยุ่น
            Row header = sheet.getRow(0);
            Map<String,Integer> idx = new HashMap<>();
            for (Cell c : header) {
                String h = f.formatCellValue(c).trim().toLowerCase();
                if (List.of("full name","name","ชื่อ","ชื่อ-สกุล").contains(h)) idx.put("fullName", c.getColumnIndex());
                if (List.of("student number","student id","รหัสนักศึกษา","รหัส").contains(h)) idx.put("studentNumber", c.getColumnIndex());
                if (List.of("email","อีเมล","อีเมล์").contains(h)) idx.put("email", c.getColumnIndex());
            }

            for (int r=1; r<=sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String fullName = get(row, idx.get("fullName"), f);
                String studentNumber = get(row, idx.get("studentNumber"), f);
                String email = get(row, idx.get("email"), f);

                if (studentNumber == null || studentNumber.isBlank()) continue;

                User u = new User();
                // ใช้ studentNumber เป็น username โดยตรง (กันซ้ำง่าย)
                u.setUsername(studentNumber.trim());
                u.setStudentNumber(studentNumber.trim());
                u.setFullname(fullName != null ? fullName.trim() : null);
                u.setEmail(email != null ? email.trim() : null);
                u.setRole(Role.STUDENT);
                outs.add(u);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file", e);
        }
        return outs;
    }

    private String get(Row row, Integer col, DataFormatter f) {
        if (col == null) return null;
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        return cell == null ? null : f.formatCellValue(cell);
    }
}
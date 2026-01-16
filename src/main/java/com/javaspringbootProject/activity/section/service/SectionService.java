package com.javaspringbootProject.activity.section.service;

import com.javaspringbootProject.activity.course.domain.Role;
import com.javaspringbootProject.activity.course.domain.User;
import com.javaspringbootProject.activity.course.repository.UserRepository;
import com.javaspringbootProject.activity.section.domain.SectionStudent;
import com.javaspringbootProject.activity.section.repository.SectionStudentRepository;
import lombok.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SectionService {

    private final UserRepository userRepo;
    private final SectionStudentRepository secStudentRepo;
    private final PasswordEncoder passwordEncoder;

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class RowError { private int row; private String reason; }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class ImportResult {
        private int created;
        private int updated;
        private int skipped;
        private List<RowError> errors = new ArrayList<>();
    }

    // --------- เพิ่ม DTO สำหรับเพิ่มเดี่ยว ----------
    @Data
    public static class SingleStudentReq {
        private String studentNumber;
        private String fullname;
        private String email;
        private String username;     // ไม่กรอกจะใช้ studentNumber
        private String password;     // ไม่กรอกจะใช้ studentNumber
    }
    @Data
    public static class SingleStudentRes {
        private Long userId;
        private boolean created;
        private boolean mappedToSection;
    }
    // -------------------------------------------------

    public ImportResult importStudents(Long sectionId, MultipartFile file) {
        List<Map<String,String>> rows = parseFile(file);
        ImportResult sum = new ImportResult(0,0,0,new ArrayList<>());

        Set<String> seenStuNo = new HashSet<>();
        int r = 1; // header row index
        for (Map<String,String> m : rows) {
            r++;

            // **คีย์หัวตารางถูกบังคับให้เป็นพิมพ์เล็กใน parseCsv/parseXlsx แล้ว**
            String stuNo    = norm(m.getOrDefault("studentnumber", ""));
            String fullname = norm(m.getOrDefault("fullname", ""));
            String email    = norm(m.getOrDefault("email", "")).toLowerCase(Locale.ROOT);
            String username = norm(m.getOrDefault("username", ""));

            if (stuNo.isBlank()) { skip(sum, r, "studentNumber missing"); continue; }
            if (!seenStuNo.add(stuNo)) { skip(sum, r, "duplicate studentNumber in file"); continue; }

            if (username.isBlank()) username = stuNo; // ใช้รหัสนักศึกษาเป็น username

            // หา user เดิมด้วย stuNo > email > username
            Optional<User> opt = userRepo.findByStudentNumber(stuNo);
            if (opt.isEmpty() && !email.isBlank()) opt = userRepo.findByEmailIgnoreCase(email);
            if (opt.isEmpty()) opt = userRepo.findByUsernameIgnoreCase(username);

            User u;
            if (opt.isEmpty()) {
                // สร้างใหม่ → role = STUDENT เสมอ, password=studentNumber
                String finalUsername = ensureUniqueUsername(username);
                u = new User();
                u.setUsername(finalUsername);
                u.setPassword(passwordEncoder.encode(stuNo));
                u.setEmail(email.isBlank()? null : email);
                u.setFullname(fullname.isBlank()? null : fullname);
                u.setStudentNumber(stuNo);
                u.setRole(Role.STUDENT);
                try {
                    u = userRepo.save(u);
                    sum.setCreated(sum.getCreated()+1);
                } catch (DataIntegrityViolationException e) {
                    skip(sum, r, "duplicate in DB (username/email/studentNumber)");
                    continue;
                }
            } else {
                // มีผู้ใช้อยู่แล้ว: ไม่เปลี่ยนรหัสผ่าน
                u = opt.get();
                boolean changed = false;
                if (u.getFullname()==null && !fullname.isBlank()) { u.setFullname(fullname); changed = true; }
                if (u.getEmail()==null && !email.isBlank()) { u.setEmail(email); changed = true; }
                if (u.getStudentNumber()==null) { u.setStudentNumber(stuNo); changed = true; }
                // ถ้าต้อง “บังคับ” ให้เป็น STUDENT เสมอ ให้ปลดคอมเมนต์บรรทัดล่าง
                // if (u.getRole() != Role.STUDENT) { u.setRole(Role.STUDENT); changed = true; }
                if (changed) {
                    try { userRepo.save(u); } catch (DataIntegrityViolationException e) {
                        skip(sum, r, "conflict while updating user");
                        continue;
                    }
                }
                sum.setUpdated(sum.getUpdated()+1);
            }

            // mapping กับ section
            if (!secStudentRepo.existsBySectionIdAndStudentId(sectionId, u.getId())) {
                secStudentRepo.save(new SectionStudent(sectionId, u.getId()));
            }
        }
        return sum;
    }

    // เพิ่ม “รายคน” โดยไม่ตรวจสิทธิ์
    public SingleStudentRes addSingleStudent(Long sectionId, SingleStudentReq req) {
        String stuNo = norm(req.getStudentNumber());
        if (stuNo.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentNumber is required");

        String username = norm(Optional.ofNullable(req.getUsername()).orElse(stuNo));
        String fullname = norm(Optional.ofNullable(req.getFullname()).orElse(""));
        String email = norm(Optional.ofNullable(req.getEmail()).orElse("")).toLowerCase(Locale.ROOT);
        String rawPass = Optional.ofNullable(req.getPassword()).filter(s -> !s.isBlank()).orElse(stuNo);

        Optional<User> opt = userRepo.findByStudentNumber(stuNo);
        if (opt.isEmpty() && !email.isBlank()) opt = userRepo.findByEmailIgnoreCase(email);
        if (opt.isEmpty()) opt = userRepo.findByUsernameIgnoreCase(username);

        User u;
        boolean created = false;
        if (opt.isEmpty()) {
            String finalUsername = ensureUniqueUsername(username);
            u = new User();
            u.setUsername(finalUsername);
            u.setPassword(passwordEncoder.encode(rawPass));
            u.setEmail(email.isBlank()? null : email);
            u.setFullname(fullname.isBlank()? null : fullname);
            u.setStudentNumber(stuNo);
            u.setRole(Role.STUDENT); // บังคับเป็นนักศึกษา
            u = userRepo.save(u);
            created = true;
        } else {
            u = opt.get();
            boolean changed = false;
            if (u.getFullname()==null && !fullname.isBlank()) { u.setFullname(fullname); changed = true; }
            if (u.getEmail()==null && !email.isBlank()) { u.setEmail(email); changed = true; }
            if (u.getStudentNumber()==null) { u.setStudentNumber(stuNo); changed = true; }
            if (changed) userRepo.save(u);
        }

        boolean mapped = false;
        if (!secStudentRepo.existsBySectionIdAndStudentId(sectionId, u.getId())) {
            secStudentRepo.save(new SectionStudent(sectionId, u.getId()));
            mapped = true;
        }

        SingleStudentRes res = new SingleStudentRes();
        res.setUserId(u.getId());
        res.setCreated(created);
        res.setMappedToSection(mapped);
        return res;
    }

    // -------- helpers --------
    private String norm(String s){ return s==null? "" : s.trim(); }
    private void skip(ImportResult sum, int row, String reason){
        sum.getErrors().add(new RowError(row, reason));
        sum.setSkipped(sum.getSkipped()+1);
    }

    private String ensureUniqueUsername(String base) {
        String cand = (base==null || base.isBlank()) ? "student" : base;
        int i = 1;
        while (userRepo.existsByUsernameIgnoreCase(cand)) {
            cand = base + "_" + i; i++;
            if (i>9999) throw new IllegalStateException("Cannot make unique username for "+base);
        }
        return cand;
    }

    private List<Map<String,String>> parseFile(MultipartFile file){
        String name = Optional.ofNullable(file.getOriginalFilename()).orElse("").toLowerCase(Locale.ROOT);
        try (InputStream in = file.getInputStream()) {
            if (name.endsWith(".csv")) return parseCsv(in);
            return parseXlsx(in);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot read file: "+e.getMessage());
        }
    }

    // ---------- NEW: CSV ที่รองรับ , ; \t + ตัด BOM + คีย์หัวตารางเป็นพิมพ์เล็ก ----------
    private List<Map<String,String>> parseCsv(InputStream in) throws IOException {
        List<Map<String,String>> out = new ArrayList<>();

        String raw = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        raw = stripBom(raw);

        String[] lines = raw.split("\\R");
        if (lines.length == 0) return out;

        String header = lines[0].trim();
        String delimiter = detectDelimiter(header); // ",", ";", "\t"

        String[] heads = header.split("\\s*" + java.util.regex.Pattern.quote(delimiter) + "\\s*");
        // ทำให้เป็น lower-case ทั้งหมด
        for (int i = 0; i < heads.length; i++) heads[i] = heads[i].trim().toLowerCase(Locale.ROOT);

        for (int li = 1; li < lines.length; li++) {
            String line = lines[li];
            if (line == null) continue;
            line = line.trim();
            if (line.isEmpty()) continue;

            // keep empty columns
            String[] cols = line.split(java.util.regex.Pattern.quote(delimiter), -1);

            Map<String,String> row = new HashMap<>();
            for (int i = 0; i < heads.length; i++) {
                String val = (i < cols.length ? cols[i] : "");
                row.put(heads[i], val == null ? "" : val.trim());
            }
            out.add(row);
        }
        return out;
    }

    private String detectDelimiter(String header) {
        if (header.indexOf('\t') >= 0) return "\t";
        boolean hasComma = header.contains(",");
        boolean hasSemi  = header.contains(";");
        if (hasSemi && !hasComma) return ";";
        return ","; // default
    }

    private String stripBom(String s) {
        if (s != null && !s.isEmpty() && s.charAt(0) == '\uFEFF') {
            return s.substring(1);
        }
        return s;
    }

    // ---------- ปรับ Xlsx ให้หัวคอลัมน์เป็นพิมพ์เล็ก ----------
    private List<Map<String,String>> parseXlsx(InputStream in) throws IOException {
        List<Map<String,String>> out = new ArrayList<>();
        try (var wb = new XSSFWorkbook(in)) {
            var sheet = wb.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows()==0) return out;

            var h = sheet.getRow(0);
            List<String> heads = new ArrayList<>();
            for (int c=0;c<h.getLastCellNum();c++) {
                heads.add(getStr(h.getCell(c)).toLowerCase(Locale.ROOT));
            }

            for (int r=1;r<=sheet.getLastRowNum();r++){
                var row = sheet.getRow(r); if (row==null) continue;
                Map<String,String> map = new HashMap<>();
                for (int c=0;c<heads.size();c++) {
                    map.put(heads.get(c), getStr(row.getCell(c)));
                }
                out.add(map);
            }
        }
        return out;
    }

    private String getStr(org.apache.poi.ss.usermodel.Cell cell){
        if (cell==null) return "";
        cell.setCellType(org.apache.poi.ss.usermodel.CellType.STRING);
        String v = cell.getStringCellValue();
        return v == null ? "" : v.trim();
    }
}

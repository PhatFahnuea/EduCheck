package com.javaspringbootProject.activity.assignment.web;

import com.javaspringbootProject.activity.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final Path root = Path.of("uploads/assignments");

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> upload(@RequestPart("files") List<MultipartFile> files) throws IOException {
        if (!Files.exists(root)) Files.createDirectories(root);

        List<String> urls = new ArrayList<>();
        for (MultipartFile f : files) {
            if (f.isEmpty()) continue;
            String ext = Optional.ofNullable(f.getOriginalFilename())
                    .filter(n -> n.contains("."))
                    .map(n -> n.substring(n.lastIndexOf(".")))
                    .orElse("");
            String name = UUID.randomUUID() + ext;
            Path dest = root.resolve(name);
            Files.copy(f.getInputStream(), dest, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            // เสิร์ฟไฟล์ผ่าน StaticResource (เช่น WebMvc config ให้ /uploads/** map ไปที่โฟลเดอร์จริง)
            urls.add("/uploads/assignments/" + name);
        }
        return new ApiResponse<>(true, "OK", urls);
    }
}
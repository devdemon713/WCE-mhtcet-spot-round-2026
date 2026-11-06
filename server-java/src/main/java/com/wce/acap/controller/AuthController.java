package com.wce.acap.controller;

import com.wce.acap.dto.AuthResponse;
import com.wce.acap.dto.LoginRequest;
import com.wce.acap.dto.RegisterRequest;
import com.wce.acap.model.User;
import com.wce.acap.repository.UserRepository;
import com.wce.acap.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        try {
            AuthResponse response = authService.register(req);
            return ResponseEntity.status(201).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        try {
            AuthResponse response = authService.login(req);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/seed-admin")
    public ResponseEntity<?> seedAdmin() {
        try {
            String result = authService.seedAdmin();
            return ResponseEntity.ok(Map.of(
                "message", result,
                "email", "admin@wce.ac.in",
                "password", "admin@123"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }
}


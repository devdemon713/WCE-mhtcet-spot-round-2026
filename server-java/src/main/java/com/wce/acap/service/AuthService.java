package com.wce.acap.service;

import com.wce.acap.dto.AuthResponse;
import com.wce.acap.dto.LoginRequest;
import com.wce.acap.dto.RegisterRequest;
import com.wce.acap.model.User;
import com.wce.acap.repository.UserRepository;
import com.wce.acap.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByApplicationId(req.getApplicationId())) {
            throw new RuntimeException("This MHT-CET Application ID is already registered");
        }
        if (userRepository.existsByEmail(req.getEmail().toLowerCase())) {
            throw new RuntimeException("Email is already registered");
        }

        User user = new User();
        user.setApplicationId(req.getApplicationId());
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail().toLowerCase());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setPhone(req.getPhone());
        user.setGender(req.getGender());
        user.setCategory(req.getCategory());
        user.setMhtCetPercentile(req.getMhtCetPercentile() != null ? req.getMhtCetPercentile() : 0.0);
        user.setStudentType(req.getStudentType());
        user.setRole("student");

        if (req.getIsPWD() != null) user.setIsPWD(req.getIsPWD());
        if (req.getIsDEF() != null) user.setIsDEF(req.getIsDEF());
        if (req.getIsOrphan() != null) user.setIsOrphan(req.getIsOrphan());
        if (req.getIsMinority() != null) user.setIsMinority(req.getIsMinority());
        if (req.getMhtCetScore() != null) user.setMhtCetScore(req.getMhtCetScore());
        if (req.getJeeMainPercentile() != null) user.setJeeMainPercentile(req.getJeeMainPercentile());
        if (req.getMathPercentile() != null) user.setMathPercentile(req.getMathPercentile());
        if (req.getPhysicsPercentile() != null) user.setPhysicsPercentile(req.getPhysicsPercentile());
        if (req.getChemistryPercentile() != null) user.setChemistryPercentile(req.getChemistryPercentile());
        if (req.getHscPercentage() != null) user.setHscPercentage(req.getHscPercentage());
        if (req.getSscAggregate() != null) user.setSscAggregate(req.getSscAggregate());
        if (req.getDiplomaPercentage() != null) user.setDiplomaPercentage(req.getDiplomaPercentage());
        if (req.getWceMeritNumber() != null) user.setWceMeritNumber(req.getWceMeritNumber());
        if (req.getStateMeritNumber() != null) user.setStateMeritNumber(req.getStateMeritNumber());

        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getId());
        return new AuthResponse(token, buildPayload(user));
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getId());
        return new AuthResponse(token, buildPayload(user));
    }

    public String seedAdmin() {
        String email = "admin@wce.ac.in";
        String password = "admin@123";

        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            existing.setRole("admin");
            existing.setFullName("WCE Admin");
            existing.setPassword(passwordEncoder.encode(password));
            userRepository.save(existing);
            return "Admin role updated for " + email;
        }

        User admin = new User();
        admin.setApplicationId("ADMIN001");
        admin.setFullName("WCE Admin");
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setPhone("9999999999");
        admin.setGender("Male");
        admin.setCategory("OPEN");
        admin.setStudentType("CAP");
        admin.setRole("admin");
        admin.setMhtCetPercentile(0.0);
        userRepository.save(admin);
        return "Admin created successfully";
    }

    public AuthResponse.UserPayload buildPayload(User user) {
        return new AuthResponse.UserPayload(
            user.getId(), user.getApplicationId(), user.getFullName(),
            user.getEmail(), user.getPhone(), user.getPhoto(),
            user.getRole(), user.getStudentType(),
            user.getWceMeritNumber(), user.getStateMeritNumber(),
            user.getCategory(), user.getGender(),
            user.getIsPWD(), user.getIsDEF(), user.getIsOrphan(), user.getIsMinority(),
            user.getMhtCetPercentile(), user.getMathPercentile(),
            user.getPhysicsPercentile(), user.getChemistryPercentile(),
            user.getHscPercentage(),
            user.getAllocationStatus(), user.getAllocatedBranch(),
            user.getAllocatedSeatCategory(), user.getAllocatedSeatType()
        );
    }
}


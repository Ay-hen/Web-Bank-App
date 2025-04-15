package demo.demo.auth;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import demo.demo.model.Permission;
import demo.demo.model.Token;
import demo.demo.model.User;
import demo.demo.repository.PermissionRepo;
import demo.demo.repository.UserRepo;
import demo.demo.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private HttpServletRequest request; 

    @Autowired
    private PermissionRepo permissionRepo;

    public ResponseEntity<?> createUser(RegisterRequest request){
        try{
            if (userRepo.findByUsername(request.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body("User already exists");
            }
    
            User user = User.builder()
                    .name(request.getName())
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .creationDate(LocalDateTime.now())
                    .role(request.getRole())
                    .build();
    
            // Save the user first to generate an ID
            userRepo.save(user);
    
            // Assign permissions if role is admin
            if ("admin".equalsIgnoreCase(request.getRole()) && request.getPermissions() != null) {
                List<Permission> permissionEntities = request.getPermissions().stream()
                    .map(p -> Permission.builder()
                        .permission(p)
                        .user(user)
                        .build())
                    .toList();
    
                permissionRepo.saveAll(permissionEntities);
                user.setPermissions(permissionEntities); 
            }

            return ResponseEntity.ok("User created successfully");
    
        } catch(Exception e){
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating user: " + e.getMessage());
        }
    }

    public ResponseEntity<?> login(LoginRequest request) {
        try{
            Optional<User> userOpt = userRepo.findByUsername(request.getUsername());

            System.out.println("User found: " + userOpt.get().getUsername());

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }

            User user = userOpt.get();

            boolean isPasswordValid = passwordEncoder.matches(request.getPassword(), user.getPassword());

            System.out.println("Password valid: " + isPasswordValid);

            if (!isPasswordValid) {
                return ResponseEntity.badRequest().body("Invalid password");
            }

            String jwtToken = jwtService.generateToken(user);
            System.out.println("Generated JWT token: " + jwtToken);

            Token token = Token.builder()
                    .user(user)
                    .token(jwtToken)
                    .expirationDate(LocalDateTime.now().plusMinutes(60))
                    .isExpired(false)
                    .revoked(false)
                    .build();
            
            System.out.println("Token created: " + token.getToken());

            jwtService.saveToken(token);

            System.out.println("Token saved: " + token.getToken());

            List<PermissionResponse> resp = user.getPermissions()
                                            .stream()
                                            .map((Permission permission) -> PermissionResponse.builder()
                                                .id(permission.getId())
                                                .permission(permission.getPermission()) 
                                                .build())
                                            .collect(Collectors.toList());
            
            return ResponseEntity.ok(
                Map.of(
                    "token", jwtToken,
                    "permission", resp,
                    "role", user.getRole()
                )
            );
        }catch(Exception e){
            return ResponseEntity.badRequest().body("User not found");
        }
    }

    @Transactional
    public ResponseEntity<?> logout() {
        // Extract the token from the Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Invalid or missing Authorization header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing token");
        }

        String token = authHeader.substring(7);

        try {
            // Extract the username from the token
            String username = jwtService.extractUsername(token);
            if (username == null) {
                System.out.println("Invalid token: Unable to extract username");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            User user = userRepo.findByUsername(username)
                    .orElseThrow(() -> {
                        System.out.println("Customer not found for username: {} "+ username);
                        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found");
                    });
    
            // Update customer's last active time
            user.setLastActive(LocalDateTime.now());
            user.setOnline(false);

            userRepo.save(user);

            jwtService.revokeToken(token);
    
            System.out.println("Logout successful for customer: {} "+ user.getId());
            return ResponseEntity.ok("Logout successful");
        } catch (ResponseStatusException e) {
            System.out.println("Customer not found during logout" + e);
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            System.out.println("Logout failed due to an internal error {} "+ e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Logout failed due to an internal error");
        }
    }

    
}

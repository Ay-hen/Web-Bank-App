package demo.demo.auth;


import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import demo.demo.model.Token;
import demo.demo.model.User;
import demo.demo.repository.UserRepo;
import demo.demo.service.JwtService;
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

    public ResponseEntity<?> createUser(RegisterRequest request){
        try{
            switch(request.getRole()){
                case "user":
                    var user = User.builder()
                            .name(request.getUserName())
                            .email(request.getEmail())
                            .password(passwordEncoder.encode(request.getPassword()))
                            .creationDate(request.getCreationDate())
                            .role("user")
                            .permissions(null)
                            .build();
                    userRepo.save(user);
                    break;

                case "admin":

                    var admin = User.builder()
                            .name(request.getUserName())
                            .email(request.getEmail())
                            .password(passwordEncoder.encode(request.getPassword()))
                            .creationDate(request.getCreationDate())
                            .role("admin")
                            .permissions(request.getPermissions())
                            .build();

                    userRepo.save(admin);
                    break;

                default:
                    return ResponseEntity.badRequest().body("Invalid role");
            }
        }catch(Exception e){
            return ResponseEntity.badRequest().body("User already exists");
        }
        return ResponseEntity.ok("User created successfully");
    } 

    public ResponseEntity<?> login(LoginRequest request) {
        try{
            Optional<User> userOpt = userRepo.findByUsername(request.getUserName());

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }

            User user = userOpt.get();

            boolean isPasswordValid = passwordEncoder.matches(request.getPassword(), user.getPassword());


            if (!isPasswordValid) {
                return ResponseEntity.badRequest().body("Invalid password");
            }

            String jwtToken = jwtService.generateToken(user);
    
            Token token = Token.builder()
                    .user(user)
                    .token(jwtToken)
                    .expirationDate(LocalDateTime.now().plusMinutes(60))
                    .isExpired(false)
                    .revoked(false)
                    .build();
            jwtService.saveToken(token);

            
            return ResponseEntity.ok(
                Map.of(
                    "token", jwtToken,
                    "permission", user.getPermissions()
                )
            );
        }catch(Exception e){
            return ResponseEntity.badRequest().body("User not found");
        }
    }
}

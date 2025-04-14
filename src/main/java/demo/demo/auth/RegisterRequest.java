package demo.demo.auth;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor


public class RegisterRequest {
    private String name;
    private String username;
    private String email;
    private String password;
    private String role;
    private LocalDateTime creationDate;
    private List<String> permissions;
}

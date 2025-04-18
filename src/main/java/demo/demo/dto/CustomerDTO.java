package demo.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerDTO {
    private Long id;
    private String name;
    private String username;
    private String email;
    private String role;
    private String lastActive;
    private String loginDate;
    private String creationDate;
}
package demo.demo.dto;

import java.math.BigDecimal;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CustomerResponse {
    private Long id;
    private String name;
    private String username;
    private String email;
    private String phoneNumber;
    private BigDecimal amount;
    private LocalDateTime createdDate;
    private String status;
}
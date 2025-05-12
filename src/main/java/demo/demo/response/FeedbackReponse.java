package demo.demo.response;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FeedbackReponse {
    private String username;                
    private String email;
    private String date;
    private String name;
    private String message;
    private String category;
    private boolean isRead;
    private String status; 
    private String answer;
    private Long id;
}

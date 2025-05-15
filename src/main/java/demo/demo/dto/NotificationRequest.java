package demo.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationRequest {
    private String title;
    private String type;
    private String message;
    private String senderModule;
    private String sendDate;
}
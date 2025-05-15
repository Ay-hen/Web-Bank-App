package demo.demo.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;


import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String message;
    private String type;
    private String senderModule;
    private LocalDateTime sendDate;
    private String groupId;

    @Builder.Default
    private boolean sent = false;
}

package demo.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import java.time.LocalDateTime;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.FetchType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "feedback_management")
public class Feedback{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    private Long id;

    @Column(name = "feedback", nullable = false)
    private String message;

    @Column(name = "feedback_category", length = 50)
    private String category;

    @Column(name = "is_read", nullable = false, columnDefinition = "boolean default false")
    private boolean isRead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; 

    @Column(name = "status", nullable = false, length = 10)
    private String status; //Rplied or Not Rplied etc..

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    @Column(name = "answer")
    private String answer; 

}
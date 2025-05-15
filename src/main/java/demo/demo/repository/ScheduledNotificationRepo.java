package demo.demo.repository;

import demo.demo.model.ScheduledNotification;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduledNotificationRepo extends JpaRepository<ScheduledNotification, Long> {
    List<ScheduledNotification> findBySentFalseAndSendDateAfter(LocalDateTime dateTime);

}
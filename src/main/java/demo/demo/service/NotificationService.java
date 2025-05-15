package demo.demo.service;

import demo.demo.dto.NotificationRequest;
import demo.demo.model.Notification;
import demo.demo.model.User;
import demo.demo.repository.NotificationRepo;
import demo.demo.repository.UserRepo;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final UserRepo userRepo;
    private final NotificationRepo notificationRepo;
    private ThreadPoolTaskScheduler scheduler;

    @PostConstruct
    public void init() {
        scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.initialize();
    }

    public void scheduleNotification(NotificationRequest request) {
        LocalDateTime sendTime = LocalDateTime.parse(request.getSendDate());

        Runnable task = () -> sendNotificationToAllUsers(request.getTitle(), request.getType(), request.getMessage(), request.getSenderModule());

        Date executionDate = Date.from(sendTime.atZone(ZoneId.systemDefault()).toInstant());
        long delay = Duration.between(LocalDateTime.now(), sendTime).toMillis();

        if (delay <= 0) {
            task.run(); // run immediately if time is now or past
        } else {
            scheduler.schedule(task, executionDate);
        }
    }

    private void sendNotificationToAllUsers(String title, String type, String message, String senderModule) {
        Notification notification = Notification.builder()
                .title(title)
                .type(type)
                .message(message)
                .senderModule(senderModule)
                .isRead(false)
                .build();

        List<User> allUsers = userRepo.findAll();
        notification.setUsers(allUsers);
        allUsers.forEach(user -> user.getNotifications().add(notification));
        notificationRepo.save(notification);
    }

    public void sendNotifications(String title, String type, String message, String senderModule) {
        Notification notification = Notification.builder()
                .title(title)
                .type(type)
                .message(message)
                .senderModule(senderModule)
                .isRead(false)
                .build();

        List<User> allUsers = userRepo.findAll();
        notification.setUsers(allUsers);
        allUsers.forEach(user -> user.getNotifications().add(notification));
        notificationRepo.save(notification);
    }
}

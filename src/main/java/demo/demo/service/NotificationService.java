package demo.demo.service;

import demo.demo.dto.NotificationRequest;
import demo.demo.model.Notification;
import demo.demo.model.User;
import demo.demo.model.ScheduledNotification;

import demo.demo.repository.ScheduledNotificationRepo;
import demo.demo.repository.NotificationRepo;
import demo.demo.repository.UserRepo;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;


@Service
public class NotificationService {

    @Autowired
    private UserRepo userRepo;
    @Autowired
    private NotificationRepo notificationRepo;
    @Autowired
    private ScheduledNotificationRepo scheduledNotificationRepo;
    private ThreadPoolTaskScheduler scheduler;

    @PostConstruct
    public void init() {
        scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.initialize();
        
        // Load and reschedule any pending notifications on startup
        loadPendingNotifications();
    }
    
    private void loadPendingNotifications() {
        List<ScheduledNotification> pendingNotifications = 
            scheduledNotificationRepo.findBySentFalseAndSendDateAfter(LocalDateTime.now());
            
        for (ScheduledNotification notification : pendingNotifications) {
            scheduleExistingNotification(notification);
        }
    }
    
    private void scheduleExistingNotification(ScheduledNotification notification) {
        LocalDateTime sendTime = notification.getSendDate();
        
        Runnable task = () -> {
            sendNotificationToAllUsers(
                notification.getTitle(), 
                notification.getType(), 
                notification.getMessage(), 
                notification.getSenderModule()
            );
            
            // Mark as sent
            notification.setSent(true);
            scheduledNotificationRepo.save(notification);
        };
        
        Date executionDate = Date.from(sendTime.atZone(ZoneId.systemDefault()).toInstant());
        scheduler.schedule(task, executionDate);
    }

    public void scheduleNotification(NotificationRequest request) {
        LocalDateTime sendTime = LocalDateTime.parse(request.getSendDate());
        
        // Create and save scheduled notification entity
        ScheduledNotification scheduledNotification = ScheduledNotification.builder()
            .title(request.getTitle())
            .message(request.getMessage())
            .type(request.getType())
            .senderModule(request.getSenderModule())
            .sendDate(sendTime)
            .sent(false)
            .build();
            
        scheduledNotificationRepo.save(scheduledNotification);
        
        // Create a task that will send notification and update status
        Runnable task = () -> {
            sendNotificationToAllUsers(
                request.getTitle(), 
                request.getType(), 
                request.getMessage(), 
                request.getSenderModule()
            );
            
            // Mark as sent
            scheduledNotification.setSent(true);
            scheduledNotificationRepo.save(scheduledNotification);
        };

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
        sendNotificationToAllUsers(title, type, message, senderModule);
    }
}

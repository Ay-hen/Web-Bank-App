package demo.demo.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionCallbackWithoutResult;
import org.springframework.transaction.support.TransactionTemplate;

import demo.demo.model.Notification;
import demo.demo.model.ScheduledNotification;
import demo.demo.model.User;

import demo.demo.dto.NotificationRequest;

import demo.demo.repository.NotificationRepo;
import demo.demo.repository.ScheduledNotificationRepo;
import demo.demo.repository.UserRepo;

import jakarta.annotation.PostConstruct;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private UserRepo userRepo;
    
    @Autowired
    private NotificationRepo notificationRepo;
    
    @Autowired
    private ScheduledNotificationRepo scheduledNotificationRepo;
    
    @Autowired
    private PlatformTransactionManager transactionManager;
    
    private TransactionTemplate transactionTemplate;
    
    private ThreadPoolTaskScheduler scheduler;

    @PostConstruct
    public void init() {
        scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.initialize();
        
        // Initialize transaction template
        transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        
        logger.info("Notification service initialized");
        loadPendingNotifications();
    }
    
    private void loadPendingNotifications() {
        try {
            List<ScheduledNotification> pendingNotifications = 
                transactionTemplate.execute(status -> 
                    scheduledNotificationRepo.findBySentFalseAndSendDateAfter(LocalDateTime.now())
                );
                
            logger.info("Found {} pending notifications to schedule", 
                pendingNotifications != null ? pendingNotifications.size() : 0);
                
            if (pendingNotifications != null) {
                for (ScheduledNotification notification : pendingNotifications) {
                    scheduleExistingNotification(notification);
                }
            }
        } catch (Exception e) {
            logger.error("Error loading pending notifications", e);
        }
    }
    
    private void scheduleExistingNotification(ScheduledNotification notification) {
        LocalDateTime sendTime = notification.getSendDate();
        
        logger.info("Scheduling existing notification ID: {} for time: {}", 
                 notification.getId(), sendTime);
        
        final Long notificationId = notification.getId();
                
        Runnable task = () -> {
            logger.info("Executing scheduled task for notification ID: {}", notificationId);
            
            transactionTemplate.execute(new TransactionCallbackWithoutResult() {
                @Override
                protected void doInTransactionWithoutResult(TransactionStatus status) {
                    try {
                        // Fetch fresh instance inside this transaction
                        ScheduledNotification currentNotification = 
                            scheduledNotificationRepo.findById(notificationId).orElse(null);
                            
                        if (currentNotification == null) {
                            logger.warn("Scheduled notification not found: {}", notificationId);
                            return;
                        }
                        
                        if (currentNotification.isSent()) {
                            logger.info("Notification already marked as sent, skipping: {}", notificationId);
                            return;
                        }
                        
                        // Execute within transaction to ensure Hibernate session is active
                        sendNotificationToAllUsersInternal(
                            currentNotification.getTitle(),
                            currentNotification.getType(),
                            currentNotification.getMessage(),
                            currentNotification.getSenderModule()
                        );
                        
                        // Mark as sent
                        currentNotification.setSent(true);
                        scheduledNotificationRepo.save(currentNotification);
                        logger.info("Notification ID: {} has been sent and marked as sent", notificationId);
                    } catch (Exception e) {
                        logger.error("Error sending scheduled notification", e);
                        status.setRollbackOnly();
                    }
                }
            });
        };
        
        Date executionDate = Date.from(sendTime.atZone(ZoneId.systemDefault()).toInstant());
        scheduler.schedule(task, executionDate);
    }

    @Transactional
    public void scheduleNotification(NotificationRequest request) {
        try {
            logger.info("Received notification request: {}", request);
            
            if (request.getSendDate() == null || request.getSendDate().isEmpty()) {
                logger.error("SendDate is null or empty in request");
                throw new IllegalArgumentException("SendDate cannot be null or empty");
            }
            
            LocalDateTime sendTime;
            try {
                sendTime = LocalDateTime.parse(request.getSendDate());
                logger.info("Parsed send time: {}", sendTime);
            } catch (Exception e) {
                logger.error("Failed to parse send date: " + request.getSendDate(), e);
                throw new IllegalArgumentException("Invalid date format. Expected ISO format (yyyy-MM-ddTHH:mm:ss)");
            }
            
            // Create and save scheduled notification entity
            ScheduledNotification scheduledNotification = ScheduledNotification.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .type(request.getType())
                .senderModule(request.getSenderModule())
                .sendDate(sendTime)
                .sent(false)
                .build();
                
            logger.info("Saving scheduled notification: {}", scheduledNotification);
            ScheduledNotification savedNotification = scheduledNotificationRepo.save(scheduledNotification);
            logger.info("Saved scheduled notification with ID: {}", savedNotification.getId());
            
            // Store the ID for use in the scheduled task
            final Long notificationId = savedNotification.getId();
            
            // Create a task that will send notification and update status
            Runnable task = () -> {
                logger.info("Executing scheduled task for notification ID: {}", notificationId);
                
                transactionTemplate.execute(new TransactionCallbackWithoutResult() {
                    @Override
                    protected void doInTransactionWithoutResult(TransactionStatus status) {
                        try {
                            // Fetch fresh instance inside this transaction
                            ScheduledNotification currentNotification = 
                                scheduledNotificationRepo.findById(notificationId).orElse(null);
                                
                            if (currentNotification == null) {
                                logger.warn("Scheduled notification not found: {}", notificationId);
                                return;
                            }
                            
                            if (currentNotification.isSent()) {
                                logger.info("Notification already marked as sent, skipping: {}", notificationId);
                                return;
                            }
                            
                            // Execute within transaction to ensure Hibernate session is active
                            sendNotificationToAllUsersInternal(
                                currentNotification.getTitle(),
                                currentNotification.getType(),
                                currentNotification.getMessage(),
                                currentNotification.getSenderModule()
                            );
                            
                            // Mark as sent
                            currentNotification.setSent(true);
                            scheduledNotificationRepo.save(currentNotification);
                            logger.info("Notification ID: {} has been sent and marked as sent", notificationId);
                        } catch (Exception e) {
                            logger.error("Error sending scheduled notification", e);
                            status.setRollbackOnly();
                        }
                    }
                });
            };

            Date executionDate = Date.from(sendTime.atZone(ZoneId.systemDefault()).toInstant());
            long delay = Duration.between(LocalDateTime.now(), sendTime).toMillis();

            if (delay <= 0) {
                logger.info("Executing notification immediately as scheduled time is now or past");
                task.run(); // run immediately if time is now or past
            } else {
                logger.info("Scheduling notification for future execution at: {}", executionDate);
                scheduler.schedule(task, executionDate);
            }
        } catch (Exception e) {
            logger.error("Error scheduling notification", e);
            throw e; // Re-throw to allow controller to handle it
        }
    }

    private void sendNotificationToAllUsersInternal(String title, String type, String message, String senderModule) {
        logger.info("Sending notification to all users: title={}, type={}", title, type);
        try {
            Notification notification = Notification.builder()
                .title(title)
                .type(type)
                .message(message)
                .senderModule(senderModule)
                .isRead(false)
                .build();

            List<User> allUsers = userRepo.findAll();

            notificationRepo.save(notification);

            for (User user : allUsers) {
                user.getNotifications().add(notification);
            }

            userRepo.saveAll(allUsers); 
            
            logger.info("Notification sent to all users successfully");
        } catch (Exception e) {
            logger.error("Error sending notification to all users", e);
            throw e;
        }
    }


    @Transactional
    public void sendNotifications(String title, String type, String message, String senderModule) {
        sendNotificationToAllUsersInternal(title, type, message, senderModule);
    }
}
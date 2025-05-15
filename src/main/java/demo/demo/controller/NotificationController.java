package demo.demo.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import demo.demo.dto.NotificationRequest;
import demo.demo.service.NotificationService;

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "http://localhost:4200")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/send-all")
    public ResponseEntity<Map<String, String>> sendScheduledNotification(@RequestBody NotificationRequest request) {
        notificationService.scheduleNotification(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification scheduled.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendNotification(@RequestBody NotificationRequest request) {
        notificationService.sendNotifications(request.getTitle(), request.getType(), request.getMessage(), request.getSenderModule());
        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification sent.");
        return ResponseEntity.ok(response);
    }
}
package demo.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import demo.demo.model.Notification;
import demo.demo.model.Customer;

public interface NotificationRepo extends JpaRepository<Notification, Long> {
    List<Notification> findByUsersAndIsReadFalse(Customer customer);
    List<Notification> findByIsReadFalse();
}
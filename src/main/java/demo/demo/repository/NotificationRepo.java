package demo.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import demo.demo.model.Notification;
import demo.demo.model.Customer;

public interface NotificationRepo extends JpaRepository<Notification, Long> {
    List<Notification> findByCustomers_UserId(Long customerId);
    List<Notification> findByCustomersAndIsReadFalse(Customer customer);
    List<Notification> findByIsReadFalse();
}
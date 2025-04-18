package demo.demo.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import demo.demo.model.Customer;

@Repository
public interface CustomerRepo extends JpaRepository<Customer, Long>{

    List<Customer> findByCreationDateAfter(LocalDateTime date);

    
}
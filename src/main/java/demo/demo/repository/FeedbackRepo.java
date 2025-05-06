package demo.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.demo.model.Feedback;

@Repository
public interface FeedbackRepo extends JpaRepository<Feedback, Long>{

    List<Feedback> findByUserUsername(String username);
    
}

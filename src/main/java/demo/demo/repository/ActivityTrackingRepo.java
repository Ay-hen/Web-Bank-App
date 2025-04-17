package demo.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.demo.model.ActivityTracking;

@Repository
public interface ActivityTrackingRepo extends JpaRepository<ActivityTracking, Long> {

    List<ActivityTracking> findByUserId(Long id);

}

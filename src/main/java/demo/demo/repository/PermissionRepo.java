package demo.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.demo.model.Permission;

@Repository
public interface PermissionRepo extends JpaRepository<Permission, Long> {
    Optional<Permission> findByUserId(Long userId); 
    void deleteByUserId(Long userId); 
    
}

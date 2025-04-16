package demo.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.demo.model.Account;

@Repository
public interface AccountRepo extends JpaRepository<Account, Long> {
    
}
package demo.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.demo.model.Balance;

@Repository
public interface BalanceRepo extends JpaRepository<Balance, Long> {
    
}

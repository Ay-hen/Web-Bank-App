package demo.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.demo.model.Account;
import demo.demo.model.CardHistory;

@Repository
public interface CardHistoryRepo extends JpaRepository<CardHistory, Long> {

    List<CardHistory> findByCardAccount(Account account);
    
}
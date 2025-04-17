package demo.demo.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import demo.demo.model.Account;
import demo.demo.model.Card;

@Repository
public interface CardRepo extends JpaRepository<Card,Long> {
    List<Card> findByAccount(Account account);

    List<Card> findByIsActivatedFalseAndActivationDateBefore(LocalDate now);
}
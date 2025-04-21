package demo.demo.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import demo.demo.model.A2ATransfer;
import demo.demo.model.Account;
import demo.demo.model.User;

@Repository
public interface A2ATransferRepo extends JpaRepository<A2ATransfer, Long> {
    List<A2ATransfer> findByAccountDebitRib(String rib);
    List<A2ATransfer> findByAccountCreditRib(String rib);
    List<A2ATransfer> findAllByOrderByDateTransactionDesc();
    List<A2ATransfer> findByAccountDebitRibOrAccountCreditRibAndDateTransactionAfter(
        String accountRib, String accountRib2, LocalDateTime dateTransaction, Sort sort
    );
    List<A2ATransfer> findByAccountDebitOrAccountCredit(Account account, Account account2);
    
    // Existing method
    long countByDateTransactionAfter(LocalDateTime date);
    
    // New methods needed for dashboard stats
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM A2ATransfer t WHERE t.dateTransaction > :date")
    Optional<BigDecimal> sumAmountByDateAfter(@Param("date") LocalDateTime date);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM A2ATransfer t WHERE t.dateTransaction BETWEEN :start AND :end")
    Optional<BigDecimal> sumAmountByDateBetween(
        @Param("start") LocalDateTime start, 
        @Param("end") LocalDateTime end
    );
    
    @Query("SELECT COUNT(t) FROM A2ATransfer t WHERE t.transactionStatus = 'COMPLETED' AND t.dateTransaction > :date")
    long countSuccessfulTransactionsAfter(@Param("date") LocalDateTime date);

    @Query("SELECT SUM(t.amount) FROM A2ATransfer t WHERE YEAR(t.dateTransaction) = :year AND MONTH(t.dateTransaction) = :month")
    Optional<BigDecimal> findTotalAmountByMonth(@Param("year") int year, @Param("month") int month);

    @Query("SELECT SUM(t.amount) FROM A2ATransfer t WHERE YEAR(t.dateTransaction) = :year")
    Optional<BigDecimal> findTotalAmountByYear(@Param("year") int year);

    @Query("SELECT DISTINCT YEAR(t.dateTransaction) FROM A2ATransfer t ORDER BY YEAR(t.dateTransaction)")
    List<Integer> findTransactionYears();
}
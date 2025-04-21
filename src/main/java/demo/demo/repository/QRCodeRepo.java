package demo.demo.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import demo.demo.enums.TransactionStatus;
import demo.demo.model.Account;
import demo.demo.model.QRCode;
import demo.demo.model.User;

public interface QRCodeRepo extends JpaRepository<QRCode, Long> {
    List<QRCode> findBySenderOrReceiver(Account sender, Account receiver);
    List<QRCode> findAll(Sort sort);
    List<QRCode> findByExpirationDateBeforeAndTransactionStatus(
        LocalDateTime expirationDate, 
        TransactionStatus status
    );
    
    @Query("SELECT SUM(q.amount) FROM QRCode q WHERE YEAR(q.dateTransaction) = :year AND MONTH(q.dateTransaction) = :month")
    Optional<BigDecimal> findTotalAmountByMonth(@Param("year") int year, @Param("month") int month);

    @Query("SELECT SUM(q.amount) FROM QRCode q WHERE YEAR(q.dateTransaction) = :year")
    Optional<BigDecimal> findTotalAmountByYear(@Param("year") int year);

    @Query("SELECT DISTINCT YEAR(q.dateTransaction) FROM QRCode q ORDER BY YEAR(q.dateTransaction)")
    List<Integer> findTransactionYears();

}
package demo.demo.repository;

import demo.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface UserRepo extends JpaRepository<User, Long> {
    Optional<User>  findByUsername(String userAuth);

    boolean existsByUsername(String username); 

    boolean existsByEmail(String userEmail);

}
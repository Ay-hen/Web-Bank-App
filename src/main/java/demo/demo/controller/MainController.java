package demo.demo.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ContentDisposition;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import demo.demo.dto.CustomerDTO;
import demo.demo.dto.CustomerResponse;
import demo.demo.model.Customer;
import demo.demo.repository.CustomerRepo;
import demo.demo.service.UserService;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:4200/")
public class MainController {

    @Autowired
    private UserService userService;

    @Autowired
    private CustomerRepo customerRepo;

    @GetMapping("/permissions")
    public ResponseEntity<?> getPermissions() {
        return ResponseEntity.ok(userService.getPermissions());
    }

    @GetMapping("/customers")
    public ResponseEntity<List<CustomerResponse>> getAllCustomers() {
        return ResponseEntity.ok(userService.getAllCustomerResponses());
    }

    @GetMapping("/report")
    public ResponseEntity<?> getReport(@RequestParam Long id) {
        return ResponseEntity.ok(userService.generateCustomerReport(id));
    }

    @GetMapping("/report/pdf")
public ResponseEntity<byte[]> downloadPdfReport(@RequestParam Long id) {
    Customer customer = customerRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Customer not found"));

    byte[] pdfBytes = userService.generateCustomerPdfReport(id);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_PDF);
    headers.setContentDisposition(
        ContentDisposition.attachment()
                .filename(customer.getName().replaceAll(" ", "_") + "_report.pdf")
                .build()
    );

    return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
}


    @GetMapping("/report/csv")
    public ResponseEntity<byte[]> downloadCsvReport(@RequestParam Long id) {
        byte[] csvBytes = userService.generateCustomerCsvReport(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDisposition(ContentDisposition.attachment().filename("report.csv").build());

        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Map<String, Object>>> getAllTransactions() {
        return ResponseEntity.ok(userService.getAllTransactions());
    }

    @GetMapping("/user/{id}/transactions")
    public ResponseEntity<List<Map<String, Object>>> getUserTransactions(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserTransactions(id));
    }


    @PostMapping("/transfer")
    public ResponseEntity<String> sendMoney(
            @RequestParam String ribSender,
            @RequestParam String ribReceiver,
            @RequestParam BigDecimal amount
            ) {

        userService.transferMoney(ribSender, ribReceiver, amount);
        return ResponseEntity.ok("Transfer successful.");
    }

    @GetMapping("/customers/month")
    public ResponseEntity<List<CustomerDTO>> getCustomersThisMonth() {
        return ResponseEntity.ok(userService.getCustomersThisMonth());
    }

    @GetMapping("/customers/6months")
    public ResponseEntity<List<CustomerDTO>> getCustomersLast6Months() {
        return ResponseEntity.ok(userService.getCustomersLast6Months());
    }


    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@RequestParam String timeFrame) {
        return ResponseEntity.ok(userService.getDashboardStats(timeFrame));
    }

    @GetMapping("/stats/monthly-joins")
    public ResponseEntity<Long> getMonthlyJoins() {
        return ResponseEntity.ok(userService.getCustomersJoinedThisMonth());
    }

    @GetMapping("/stats/yearly-joins")
    public ResponseEntity<Long> getYearlyJoins() {
        return ResponseEntity.ok(userService.getCustomersJoinedThisYear());
    }

    @GetMapping("/stats/total-customers")
    public ResponseEntity<Long> getTotalCustomers() {
        return ResponseEntity.ok(userService.getTotalCustomers());
    }

    @GetMapping("/stats/growth-rate")
    public ResponseEntity<?> getGrowthRate() {
        return ResponseEntity.ok(userService.getCustomerGrowthRates());
    }

    @GetMapping("/stats/customers-months")
    public ResponseEntity<?> customersRegister() {
        return ResponseEntity.ok(userService.getCustomerRegistrationsLast6Months());
    }

    @GetMapping("/stats/customers-years")
    public ResponseEntity<?> customersRegisterYears() {
        return ResponseEntity.ok(userService.getCustomerRegistrationsByYear());
    }

    @GetMapping("/transactions/monthly")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyTransactionSummary() {
        return ResponseEntity.ok(userService.getMonthlyTransactionAmountsLast6Months());
    }

    @GetMapping("/transactions/yearly")
    public ResponseEntity<List<Map<String, Object>>> getYearlyTransactionSummary() {
        return ResponseEntity.ok(userService.getYearlyTransactionAmounts());
    }

    @GetMapping("/transaction/growth-rate/monthly")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyGrowthRates() {
        return ResponseEntity.ok(userService.getMonthlyTransactionGrowthRates());
    }

    @GetMapping("/transaction/growth-rate/yearly")
    public ResponseEntity<List<Map<String, Object>>> getYearlyGrowthRates() {
        return ResponseEntity.ok(userService.getYearlyTransactionGrowthRates());
    }

    @GetMapping("/activities/{id}")
    public ResponseEntity<?> getUserActivity(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserActivities(id));
    }

}

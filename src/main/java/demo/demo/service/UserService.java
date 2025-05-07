package demo.demo.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;

import java.math.BigDecimal;
import java.math.RoundingMode;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.stream.Collectors;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

import demo.demo.auth.PermissionResponse;

import demo.demo.dto.CustomerDTO;
import demo.demo.dto.CustomerResponse;
import demo.demo.dto.FeedbackDTO;

import demo.demo.enums.TransactionStatus;
import demo.demo.enums.TransactionType;

import demo.demo.response.FeedbackReponse;

import demo.demo.model.A2ATransfer;
import demo.demo.model.Account;
import demo.demo.model.ActivityTracking;
import demo.demo.model.Balance;
import demo.demo.model.Customer;
import demo.demo.model.Feedback;
import demo.demo.model.Permission;
import demo.demo.model.QRCode;
import demo.demo.model.User;

import demo.demo.repository.PermissionRepo;
import demo.demo.repository.BalanceRepo;
import demo.demo.repository.QRCodeRepo;
import demo.demo.repository.UserRepo;
import demo.demo.repository.A2ATransferRepo;
import demo.demo.repository.AccountRepo;
import demo.demo.repository.ActivityTrackingRepo;
import demo.demo.repository.CustomerRepo;
import demo.demo.repository.FeedbackRepo;
import demo.demo.response.ActivityReponse;

@Service
public class UserService {
    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PermissionRepo permissionRepo;


    @Autowired
    private ActivityTrackingRepo activityTrackingRepo;

    @Autowired
    private CustomerRepo customerRepo;

    @Autowired
    private QRCodeRepo qrCodeRepo;

    @Autowired
    private A2ATransferRepo a2aTransferRepo;

    @Autowired
    private ActivityTrackingRepo activityRepo;

    @Autowired
    private FeedbackRepo feedbackRepo;

    @Autowired
    private BalanceRepo balanceRepo;
    
    public void assignPermissionsToUser(Long userId, List<Long> permissionIds) {

        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        List<Permission> permissions = permissionRepo.findAllById(permissionIds);

        user.setPermissions(permissions);

        userRepo.save(user);
    }

    public List<PermissionResponse> getUserPermissions(Long userId) {

        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        List<PermissionResponse> permissions = user.getPermissions().stream()
                .map(permission -> PermissionResponse.builder()
                        .id(permission.getId())
                        .permission(permission.getPermission())
                        .build())
                .toList();

        return permissions;
    }

    public List<PermissionResponse> getAllPermissions() {

        List<Permission> permissions = permissionRepo.findAll();
        List<PermissionResponse> perm = permissions.stream()
                .map(permission -> PermissionResponse.builder()
                        .id(permission.getId())
                        .permission(permission.getPermission())
                        .build())
                .toList();

        return perm;
    }

    public void createUser(User user) {
        userRepo.save(user);
    }

    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    public void setUserBlockStatus(Long userId, boolean blockStatus) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User with ID " + userId + " not found"));
        
        if (user.isBlocked() != blockStatus) {
            user.setBlocked(blockStatus);
            userRepo.save(user);
        }
    }

    public List<CustomerResponse> getAllCustomerResponses() {
        List<Customer> customers = customerRepo.findAll();

        return customers.stream().map(customer -> {
            Account account = customer.getAccount();

            return CustomerResponse.builder()
                    .id(customer.getId())
                    .name(customer.getName())
                    .email(customer.getEmail())
                    .phoneNumber(customer.getPhoneNumber())
                    .rib(account != null ? account.getRib() : "N/A")
                    .createdDate(customer.getCreationDate())
                    .status(account != null ? account.getAccountStatus() : "N/A")
                    .build();
        }).collect(Collectors.toList());
    }

    public List<CustomerResponse> searchCustomers(String search) {
        // find any customer whose name **or** username contains the search string (case-insensitive)
        List<Customer> customers = customerRepo
            .findByNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(search, search);
        return customers.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    public List<CustomerResponse> searchUsers(String search) {
        
        List<User> users = userRepo
            .findByNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(search, search);
        return users.stream()
            .filter(user -> user.getRole().equals("USER"))
            .map(user -> {
                return CustomerResponse.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .createdDate(user.getCreationDate())
                    .status(user.isBlocked() ? "Blocked" : "Active")
                    .build();
            })
            .collect(Collectors.toList());
    }

    private CustomerResponse toResponse(Customer customer) {
        Account account = customer.getAccount();
        return CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .username(customer.getUsername())
                .email(customer.getEmail())
                .phoneNumber(customer.getPhoneNumber())
                .amount(account != null ? account.getBalance().getCurrentAmount() : BigDecimal.ZERO)
                .createdDate(customer.getCreationDate())
                .status(account != null ? account.getAccountStatus() : "N/A")
                .build();
    }

    public Map<String, Object> generateCustomerReport(Long customerId) {
        Map<String, Object> reportData = new HashMap<>();

        // Fetch customer
        Customer customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Check if the user has role CUSTOMER
        if (!"CUSTOMER".equalsIgnoreCase(customer.getRole())) {
            throw new RuntimeException("Only customers are allowed for this report");
        }

        // Fetch account
        Account account = customer.getAccount();

        // Add account-related fields
        reportData.put("amount", account != null ? account.getBalance().getCurrentAmount() : BigDecimal.ZERO);
        reportData.put("rib", account != null ? account.getRib() : "N/A");

        // Add user-related fields
        reportData.put("email", customer.getEmail());
        reportData.put("creationDate", customer.getCreationDate());
        reportData.put("securityQuestion", customer.getSecurityQuestion());
        reportData.put("answer", customer.getAnswer());
        reportData.put("cin", customer.getCin());
        reportData.put("birthday", customer.getBirthday());

        // Fetch activities
        List<ActivityTracking> activities = activityTrackingRepo.findByUserId(customer.getId());

        List<Map<String, Object>> activityLogs = activities.stream().map(activity -> {
            Map<String, Object> activityData = new HashMap<>();
            activityData.put("operationType", activity.getOperationType());
            activityData.put("operationDate", activity.getOperationDate());
            activityData.put("userIp", activity.getUserIp());
            activityData.put("description", activity.getOperationDescription());
            return activityData;
        }).collect(Collectors.toList());

        reportData.put("activities", activityLogs);

        return reportData;
    }

    public byte[] generateCustomerPdfReport(Long id) {
        Customer customer = customerRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Account account = customer.getAccount();
        List<ActivityTracking> activities = activityTrackingRepo.findByUserId(id);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        Document document = new Document();
        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            document.add(new Paragraph(customer.getName()+" Report", titleFont));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Name            :   " + customer.getName(), normalFont));
            document.add(new Paragraph("Email           :   " + customer.getEmail()));
            document.add(new Paragraph("CIN             :   " + customer.getCin()));
            document.add(new Paragraph("Phone           :   " + customer.getPhoneNumber()));
            document.add(new Paragraph("Birthday        :   " + customer.getBirthday()));
            document.add(new Paragraph("Security Q&A    :   " + customer.getSecurityQuestion() + " / " + customer.getAnswer()));
            if (account != null) {
                document.add(new Paragraph("RIB         :   " + account.getRib()));
                document.add(new Paragraph("Balance      :   " + account.getBalance().getCurrentAmount()));
            }
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Activities      :   ", titleFont));
            for (ActivityTracking activity : activities) {
                document.add(new Paragraph("- " + activity.getOperationType() + " on " + activity.getOperationDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a"))
                        + " : " + activity.getOperationDescription()));
            }

            List<Map<String, Object>> transactions = getUserTransactions(id);

            document.add(new Paragraph(" "));
            document.add(new Paragraph("Transactions    :   ", titleFont));
            for (Map<String, Object> tx : transactions) {
                document.add(new Paragraph("- " + tx.get("direction") + " : " + tx.get("amount") + " (" + tx.get("type") + ") on " + tx.get("date")));
            }


            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }

        return baos.toByteArray();
    }

    public byte[] generateCustomerCsvReport(Long id) {
        Customer customer = customerRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Account account = customer.getAccount();
        List<ActivityTracking> activities = activityTrackingRepo.findByUserId(id);

        StringWriter writer = new StringWriter();
        CSVPrinter csvPrinter;

        try {
            csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT
                    .withHeader("Field", "Value"));

            csvPrinter.printRecord("Name", customer.getName());
            csvPrinter.printRecord("Email", customer.getEmail());
            csvPrinter.printRecord("CIN", customer.getCin());
            csvPrinter.printRecord("Phone", customer.getPhoneNumber());
            csvPrinter.printRecord("Birthday", customer.getBirthday());
            csvPrinter.printRecord("Security Question", customer.getSecurityQuestion());
            csvPrinter.printRecord("Answer", customer.getAnswer());

            if (account != null) {
                csvPrinter.printRecord("RIB", account.getRib());
                csvPrinter.printRecord("Balance", account.getBalance().getCurrentAmount());
                csvPrinter.printRecord("Currency", account.getCurrency().getCurrencyName());
            }

            csvPrinter.println();
            csvPrinter.printRecord("Activity Date", "Operation Type", "Description");

            for (ActivityTracking activity : activities) {
                csvPrinter.printRecord(activity.getOperationDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")), activity.getOperationType(), activity.getOperationDescription());
            }

            csvPrinter.println();
            csvPrinter.printRecord("Direction", "Amount", "Type", "Date", "Status");

            List<Map<String, Object>> transactions = getUserTransactions(id);
            for (Map<String, Object> tx : transactions) {
                csvPrinter.printRecord(tx.get("direction"), tx.get("amount"), tx.get("type"), tx.get("date"), tx.get("status"));
            }


            csvPrinter.flush();
        } catch (IOException e) {
            throw new RuntimeException("Error generating CSV", e);
        }

        return writer.toString().getBytes(StandardCharsets.UTF_8);
    }



    public byte[] generateCustomerTransactionsPdfReport(Long id) {
        Customer customer = customerRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    
        Account account = customer.getAccount();        
    
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
    
        try {
            PdfWriter.getInstance(document, baos);
            document.open();
    
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font monoFont = FontFactory.getFont(FontFactory.COURIER, 12);  // Use monospaced font for alignment
    
            document.add(new Paragraph(customer.getName() + " Transactions Report", titleFont));
            document.add(new Paragraph(" "));
    
            // Align fields using fixed-width formatting
            document.add(new Paragraph(String.format("%-12s: %s", "Name", customer.getName()), monoFont));
            document.add(new Paragraph(String.format("%-12s: %s", "Email", customer.getEmail()), monoFont));
            document.add(new Paragraph(String.format("%-12s: %s", "CIN", customer.getCin()), monoFont));
            document.add(new Paragraph(String.format("%-12s: %s", "Phone", customer.getPhoneNumber()), monoFont));
    
            if (account != null) {
                document.add(new Paragraph(String.format("%-12s: %s", "RIB", account.getRib()), monoFont));
                document.add(new Paragraph(String.format("%-12s: %s", "Balance ", account.getBalance().getCurrentAmount()), monoFont));
            }
    
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Transactions:", titleFont));
            document.add(new Paragraph(" "));
    
            List<Map<String, Object>> transactions = getUserTransactions(id);
    
            if (transactions.isEmpty()) {
                document.add(new Paragraph("No transactions found.", monoFont));
            } else {
                for (Map<String, Object> tx : transactions) {
                    String line = String.format(
                        "%-22s | %-10s | %-8s | %s",
                        tx.getOrDefault("direction", "N/A"),
                        tx.getOrDefault("amount", "0"),
                        tx.getOrDefault("type", "N/A"),
                        tx.getOrDefault("date", "Unknown")
                    );
                    document.add(new Paragraph(line, monoFont));
                }
            }
    
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    
        return baos.toByteArray();
    }
    
    

    public byte[] generateCustomerTransactionsCsvReport(Long id) {
        Customer customer = customerRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    
        Account account = customer.getAccount();
        List<Map<String, Object>> transactions = getUserTransactions(id);
    
        StringBuilder sb = new StringBuilder();
    
        // Header
        sb.append("Customer Name,Email,CIN,Phone,RIB,Amount\n");
        sb.append(String.format("%s,%s,%s,%s,%s,%s\n",
                customer.getName(),
                customer.getEmail(),
                customer.getCin(),
                customer.getPhoneNumber(),
                account != null ? account.getRib() : "N/A",
                account != null ? account.getBalance().getCurrentAmount() : "0"
        ));
    
        sb.append("\nTransaction Details\n");
        sb.append("Direction,Amount,Type,Date\n");
    
        for (Map<String, Object> tx : transactions) {
            sb.append(String.format("%s,%s,%s,%s\n",
                    tx.getOrDefault("direction", "N/A"),
                    tx.getOrDefault("amount", "0"),
                    tx.getOrDefault("type", "N/A"),
                    tx.getOrDefault("date", "Unknown")
            ));
        }
    
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
    


    public List<Map<String, Object>> getAllTransactions() {
        List<Map<String, Object>> transactions = new ArrayList<>();

        List<A2ATransfer> a2aTransfers = a2aTransferRepo.findAll();
        for (A2ATransfer transfer : a2aTransfers) {
            Map<String, Object> tx = new HashMap<>();
        
            String senderName = "N/A";
            String recipientName = "N/A";
        
            if (transfer.getAccountDebit() != null && transfer.getAccountDebit().getCustomer() != null) {
                senderName = transfer.getAccountDebit().getCustomer().getName();
            }
        
            if (transfer.getAccountCredit() != null && transfer.getAccountCredit().getCustomer() != null) {
                recipientName = transfer.getAccountCredit().getCustomer().getName();
            }
        
            tx.put("sender", senderName);
            tx.put("recipient", recipientName);
            tx.put("amount", transfer.getAmount());
            tx.put("status", transfer.getTransactionStatus().name());
            tx.put("type", transfer.getTransactionType().name());
            tx.put("date", transfer.getDateTransaction().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")));
        
            transactions.add(tx);
        }
        

        List<QRCode> qrCodes = qrCodeRepo.findAll();
        for (QRCode qr : qrCodes) {
            Map<String, Object> tx = new HashMap<>();
            tx.put("sender", qr.getSender() != null ? qr.getSender().getCustomer().getName() : "N/A");
            tx.put("recipient", qr.getReceiver().getCustomer().getName());
            tx.put("amount", qr.getAmount());
            tx.put("status", qr.getTransactionStatus().name());
            tx.put("type", qr.getTransactionType().name());
            tx.put("date", qr.getDateTransaction().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")));
            transactions.add(tx);
        }

        return transactions;
    }

    public List<Map<String, Object>> getUserTransactions(Long userId) {
        List<Map<String, Object>> transactions = new ArrayList<>();
        Customer customer = customerRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        Account account = customer.getAccount();
    
        List<A2ATransfer> a2aTransfers = a2aTransferRepo.findAll();
        for (A2ATransfer transfer : a2aTransfers) {
            Account debit = transfer.getAccountDebit();
            Account credit = transfer.getAccountCredit();
        
            Map<String, Object> tx = new HashMap<>();
            tx.put("amount", transfer.getAmount());
            tx.put("status", transfer.getTransactionStatus().name());
            tx.put("type", transfer.getTransactionType().name());
            tx.put("date", transfer.getDateTransaction().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")));
        
            // DEPOSIT case (debit is null, credit is current user)
            if (debit == null && credit != null && credit.equals(account) && transfer.getTransactionType() == TransactionType.DEPOSIT) {
                tx.put("direction", "Deposit");
                transactions.add(tx);
                continue;
            }
        
            // Skip if both accounts are null or unrelated
            if ((debit == null || credit == null) ||
                (!account.equals(debit) && !account.equals(credit))) {
                continue;
            }
        
            if (account.equals(debit)) {
                tx.put("direction", "Sent to " + credit.getCustomer().getName());
            } else if (account.equals(credit)) {
                tx.put("direction", "Received from " + debit.getCustomer().getName());
            }
        
            transactions.add(tx);
        }


        List<QRCode> qrCodes = qrCodeRepo.findAll();
        for (QRCode qr : qrCodes) {
            Account sender = qr.getSender();
            Account receiver = qr.getReceiver();
    
            // skip invalid QR code
            if (sender == null || receiver == null) continue;
    
            Map<String, Object> tx = new HashMap<>();
            tx.put("amount", qr.getAmount());
            tx.put("status", qr.getTransactionStatus().name());
            tx.put("type", qr.getTransactionType().name());
            tx.put("date", qr.getDateTransaction().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")));
    
            if (sender.equals(account)) {
                tx.put("direction", "Sent to " + receiver.getCustomer().getName());
            } else if (receiver.equals(account)) {
                tx.put("direction", "Received from " + sender.getCustomer().getName());
            } else {
                continue;
            }
    
            transactions.add(tx);
        }
    
        return transactions;
    }
    



    
    private AccountRepo accountRepo;

    public boolean existsByRib(String rib) {
        return accountRepo.existsByRib(rib);
    }

    public String getRib(String authenticator) {
        return accountRepo.findByAuthenticator(authenticator)
                .orElseThrow(() -> new RuntimeException("Account not found"))
                .getRib();
    }

    @Transactional
    public void transferMoney(String ribSender, String ribReceiver, BigDecimal amount) {
        Account sender = null;
        Account receiver = null;
        Customer user = null;

        try {
            sender = accountRepo.findByRib(ribSender)
                    .orElseThrow(() -> new RuntimeException("Sender account not found"));
            receiver = accountRepo.findByRib(ribReceiver)
                    .orElseThrow(() -> new RuntimeException("Receiver account not found"));
            user = sender.getCustomer();

            if (sender.getBalance().getCurrentAmount().compareTo(amount) < 0) {
                throw new RuntimeException("Insufficient balance in sender's account");
            }

            Balance senderBalance = Balance.builder()
                    .currentAmount(sender.getBalance().getCurrentAmount())
                    .account(sender)
                    .build();
            Balance receiverBalance = Balance.builder()
                    .currentAmount(receiver.getBalance().getCurrentAmount())
                    .account(receiver)
                    .build();

            balanceRepo.save(senderBalance);
            balanceRepo.save(receiverBalance);

            sender.setBalance(senderBalance);
            receiver.setBalance(receiverBalance);

            accountRepo.save(sender);
            accountRepo.save(receiver);

            A2ATransfer a2aTransfer = A2ATransfer.builder()
                    .amount(amount)
                    .accountDebit(sender)
                    .accountCredit(receiver)
                    .accountDebitRib(sender.getRib())
                    .accountCreditRib(ribReceiver)
                    .transactionType(TransactionType.TRANSFER)
                    .transactionStatus(TransactionStatus.COMPLETED)
                    .dateTransaction(LocalDateTime.now())
                    .build();

            a2aTransferRepo.save(a2aTransfer);


        } catch (Exception e) {
            String errorMessage = "Transfer failed: " + e.getMessage();
            List<Customer> recipients = new ArrayList<>();
            if (sender != null && sender.getCustomer() != null) {
                recipients.add(sender.getCustomer());
            }
            if (receiver != null && receiver.getCustomer() != null) {
                recipients.add(receiver.getCustomer());
            }

            throw new RuntimeException("Transfer failed: " + e.getMessage(), e);
        }
    }

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mma");

    public List<CustomerDTO> getCustomersThisMonth() {
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        return customerRepo.findByCreationDateAfter(startOfMonth)
                .stream()
                .map(this::toCustomerDTO)
                .collect(Collectors.toList());
    }

    public List<CustomerDTO> getCustomersLast6Months() {
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        return customerRepo.findByCreationDateAfter(sixMonthsAgo)
                .stream()
                .map(this::toCustomerDTO)
                .collect(Collectors.toList());
    }

    private CustomerDTO toCustomerDTO(Customer customer) {
        return CustomerDTO.builder()
                .id(customer.getId())
                .name(customer.getName())
                .username(customer.getUsernameCustomer())
                .email(customer.getEmail())
                .role(customer.getRole())
                .lastActive(customer.getLastActive() != null ? customer.getLastActive().toString() : null)
                .loginDate(customer.getLoginDate() != null ? customer.getLoginDate().toString() : null)
                .creationDate(customer.getCreationDate() != null ? customer.getCreationDate().format(formatter) : null)
                .build();
    }


    public Map<String, Object> getDashboardStats(String timeFrame) {
        return null;
    }

    public long getCustomersJoinedThisMonth() {
        List<Customer> allCustomers = customerRepo.findAll();
    
        LocalDate now = LocalDate.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();
    
        return allCustomers.stream()
            .filter(c -> c.getCreationDate() != null)
            .filter(c -> {
                LocalDateTime creation = c.getCreationDate();
                return creation.getYear() == currentYear && creation.getMonthValue() == currentMonth;
            })
            .count();
    }
    

    public long getCustomersJoinedThisYear() {
        List<Customer> allCustomers = customerRepo.findAll();

        int currentYear = LocalDate.now().getYear();

        return allCustomers.stream()
            .filter(c -> c.getCreationDate() != null)
            .filter(c -> c.getCreationDate().getYear() == currentYear)
            .count();
    }

    public long getTotalCustomers() {
        return customerRepo.count();
    }
    public long getTotalUsers() {
        return userRepo.count();
    }

    public Map<String, Double> getCustomerGrowthRates() {
        List<Customer> allCustomers = customerRepo.findAll();
    
        LocalDate now = LocalDate.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();
    
        // === Monthly Growth ===
        long currentMonthCount = allCustomers.stream()
            .filter(c -> c.getCreationDate() != null)
            .filter(c -> {
                LocalDateTime creation = c.getCreationDate();
                return creation.getYear() == currentYear && creation.getMonthValue() == currentMonth;
            })
            .count();
    
        int prevMonth = currentMonth == 1 ? 12 : currentMonth - 1;
        int prevMonthYear = currentMonth == 1 ? currentYear - 1 : currentYear;
    
        long previousMonthCount = allCustomers.stream()
            .filter(c -> c.getCreationDate() != null)
            .filter(c -> {
                LocalDateTime creation = c.getCreationDate();
                return creation.getYear() == prevMonthYear && creation.getMonthValue() == prevMonth;
            })
            .count();
    
        double monthlyGrowth = previousMonthCount == 0
            ? (currentMonthCount > 0 ? 100.0 : 0.0)
            : ((currentMonthCount - previousMonthCount) / (double) previousMonthCount) * 100;
    
        // === Yearly Growth ===
        long currentYearCount = allCustomers.stream()
            .filter(c -> c.getCreationDate() != null)
            .filter(c -> c.getCreationDate().getYear() == currentYear)
            .count();
    
        long previousYearCount = allCustomers.stream()
            .filter(c -> c.getCreationDate() != null)
            .filter(c -> c.getCreationDate().getYear() == currentYear - 1)
            .count();
    
        double yearlyGrowth = previousYearCount == 0
            ? (currentYearCount > 0 ? 100.0 : 0.0)
            : ((currentYearCount - previousYearCount) / (double) previousYearCount) * 100;
    
        // === Return Map ===
        Map<String, Double> growthRates = new HashMap<>();
        growthRates.put("monthly", monthlyGrowth);
        growthRates.put("yearly", yearlyGrowth);
    
        return growthRates;
    }
    
    
    public List<Map<String, Object>> getCustomerRegistrationsLast6Months() {
        LocalDate now = LocalDate.now();
        LocalDate sixMonthsAgo = now.minusMonths(5).withDayOfMonth(1); // start from the beginning of that month

        List<Customer> customers = customerRepo.findByCreationDateAfter(sixMonthsAgo.atStartOfDay());

        Map<YearMonth, Long> countsByMonth = customers.stream()
            .filter(c -> c.getCreationDate() != null)
            .collect(Collectors.groupingBy(
                c -> YearMonth.from(c.getCreationDate()),
                Collectors.counting()
            ));

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            YearMonth month = YearMonth.from(now.minusMonths(5 - i));
            long count = countsByMonth.getOrDefault(month, 0L);

            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            monthData.put("count", count);
            result.add(monthData);
        }

        return result;
    }


    public List<Map<String, Object>> getCustomerRegistrationsByYear() {
        List<Customer> allCustomers = customerRepo.findAll();
    
        // Group by year of creation
        Map<Integer, Long> countsByYear = allCustomers.stream()
            .filter(c -> c.getCreationDate() != null)
            .collect(Collectors.groupingBy(
                c -> c.getCreationDate().getYear(),
                TreeMap::new, // Sorted by year
                Collectors.counting()
            ));
    
        // Convert to list of maps
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<Integer, Long> entry : countsByYear.entrySet()) {
            Map<String, Object> yearData = new HashMap<>();
            yearData.put("year", entry.getKey());
            yearData.put("count", entry.getValue());
            result.add(yearData);
        }
    
        return result;
    }

    // For Users
    public List<Map<String, Object>> getUserRegistrationsLast6Months() {
        LocalDate now = LocalDate.now();
        LocalDate sixMonthsAgo = now.minusMonths(5).withDayOfMonth(1); // Start from beginning of the month
    
        List<User> users = userRepo.findByCreationDateAfter(sixMonthsAgo.atStartOfDay());
    
        Map<YearMonth, Long> countsByMonth = users.stream()
            .filter(u -> u.getCreationDate() != null)
            .collect(Collectors.groupingBy(
                u -> YearMonth.from(u.getCreationDate()),
                Collectors.counting()
            ));
    
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            YearMonth month = YearMonth.from(now.minusMonths(5 - i));
            long count = countsByMonth.getOrDefault(month, 0L);
    
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            monthData.put("count", count);
            result.add(monthData);
        }
    
        return result;
    }
    
    public List<Map<String, Object>> getUserRegistrationsByYear() {
        List<User> allUsers = userRepo.findAll();
    
        Map<Integer, Long> countsByYear = allUsers.stream()
            .filter(u -> u.getCreationDate() != null)
            .collect(Collectors.groupingBy(
                u -> u.getCreationDate().getYear(),
                TreeMap::new, // Sorted by year
                Collectors.counting()
            ));
    
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<Integer, Long> entry : countsByYear.entrySet()) {
            Map<String, Object> yearData = new HashMap<>();
            yearData.put("year", entry.getKey());
            yearData.put("count", entry.getValue());
            result.add(yearData);
        }
    
        return result;
    }
    //end

    @Autowired
    private A2ATransferRepo a2aRepo;
    
    public List<Map<String, Object>> getMonthlyTransactionAmountsLast6Months() {
    LocalDate now = LocalDate.now();
    List<Map<String, Object>> results = new ArrayList<>();

    for (int i = 5; i >= 0; i--) {
        YearMonth yearMonth = YearMonth.from(now.minusMonths(i));
        BigDecimal totalA2A = a2aRepo.findTotalAmountByMonth(yearMonth.getYear(), yearMonth.getMonthValue()).orElse(BigDecimal.ZERO);
        BigDecimal totalQR = qrCodeRepo.findTotalAmountByMonth(yearMonth.getYear(), yearMonth.getMonthValue()).orElse(BigDecimal.ZERO);

        BigDecimal total = totalA2A.add(totalQR);

        results.add(Map.of(
            "month", yearMonth.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH).toUpperCase(),
            "amount", total
        ));
    }

    return results;
}

public List<Map<String, Object>> getYearlyTransactionAmounts() {
    List<Integer> years = a2aRepo.findTransactionYears();
    years.addAll(qrCodeRepo.findTransactionYears());
    Set<Integer> uniqueYears = new TreeSet<>(years); 

    List<Map<String, Object>> result = new ArrayList<>();

    for (int year : uniqueYears) {
        BigDecimal a2aTotal = a2aRepo.findTotalAmountByYear(year).orElse(BigDecimal.ZERO);
        BigDecimal qrTotal = qrCodeRepo.findTotalAmountByYear(year).orElse(BigDecimal.ZERO);

        BigDecimal total = a2aTotal.add(qrTotal);

        result.add(Map.of(
            "year", year,
            "amount", total
            ));
        }

        return result;
    }

    public Map<String, Long> getCustomerSegments() {
        return customerRepo.findAll().stream()
            .filter(c -> c.getRole() != null)
            .collect(Collectors.groupingBy(
                Customer::getRole, Collectors.counting()
            ));
    }
    
    public List<Map<String, Object>> getMonthlyTransactionGrowthRates() {
        List<Map<String, Object>> monthlyData = getMonthlyTransactionAmountsLast6Months();
        List<Map<String, Object>> growthList = new ArrayList<>();
    
        for (int i = 0; i < monthlyData.size(); i++) {
            Map<String, Object> current = monthlyData.get(i);
            String month = (String) current.get("month");
            BigDecimal currentAmount = (BigDecimal) current.get("amount");
    
            double growth = 0.0;
            if (i > 0) {
                BigDecimal previousAmount = (BigDecimal) monthlyData.get(i - 1).get("amount");
                growth = previousAmount.compareTo(BigDecimal.ZERO) == 0
                    ? (currentAmount.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0)
                    : currentAmount.subtract(previousAmount)
                        .divide(previousAmount, 4, RoundingMode.HALF_UP)
                        .doubleValue() * 100;
            }
    
            Map<String, Object> result = new HashMap<>();
            result.put("month", month);
            result.put("amount", currentAmount);
            result.put("growth", Math.round(growth * 10) / 10.0);
            growthList.add(result);
        }
    
        return growthList;
    }

    public List<Map<String, Object>> getYearlyTransactionGrowthRates() {
        List<Map<String, Object>> yearlyData = getYearlyTransactionAmounts();
        List<Map<String, Object>> growthList = new ArrayList<>();
        
        for (int i = 0; i < yearlyData.size(); i++) {
            Map<String, Object> current = yearlyData.get(i);
            String year = String.valueOf(current.get("year"));
            BigDecimal currentAmount = (BigDecimal) current.get("amount");
            
            double growth = 0.0;
            if (i > 0) {
                BigDecimal previousAmount = (BigDecimal) yearlyData.get(i - 1).get("amount");
                if (previousAmount.compareTo(BigDecimal.ZERO) == 0) {
                    // Handle division by zero case
                    growth = currentAmount.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
                } else {
                    // Calculate percentage growth
                    growth = currentAmount.subtract(previousAmount)
                        .multiply(new BigDecimal(100))
                        .divide(previousAmount, 4, RoundingMode.HALF_UP)
                        .doubleValue();
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("year", year);
            result.put("amount", currentAmount);
            result.put("growth", Math.round(growth * 10) / 10.0);
            growthList.add(result);
        }
        
        return growthList;
    }
    
    public List<Map<String, String>> getPermissions() {
        List<Map<String, String>> permissions = new ArrayList<>();
        
        addPermission(permissions, "VIEW_DASHBOARD", "View Dashboard");
        addPermission(permissions, "MANAGE_USERS", "Manage Users");
        addPermission(permissions, "MANAGE_FEEDBACK", "Manage Feedback");
        addPermission(permissions, "MANAGE_TRANSACTIONS", "Manage Transactions");
        addPermission(permissions, "MANAGE_NOTIFICATIONS", "Manage Notifications");
        addPermission(permissions, "MANAGE_ADMIN", "Manage Admin");
        
        return permissions;
    }
    
    private void addPermission(List<Map<String, String>> permissions, String code, String name) {
        Map<String, String> permission = new HashMap<>();
        permission.put("code", code);
        permission.put("name", name);
        permissions.add(permission);
    }

    public List<ActivityReponse> getUserActivities(Long userId) {
        List<ActivityTracking> activities = activityRepo.findByUserId(userId);
        return activities.stream()
                .map(activity -> ActivityReponse.builder()
                        .activity(activity.getOperationDescription())
                        .date(activity.getOperationDate())
                        .build())
                .collect(Collectors.toList());
    }

    public ResponseEntity<?> createFeedback(String username, FeedbackDTO feedback) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Feedback fb = Feedback.builder()
                .message(feedback.getMessage())
                .category(feedback.getCategory())
                .status("pending")
                .isRead(false)
                .user(user) 
                .answer("")
                .date(LocalDateTime.now())
                .build();

        if(user.getFeedbacks() == null) {
            user.setFeedbacks(new ArrayList<>());
        }

        user.getFeedbacks().add(fb);
        
        userRepo.save(user);

        return ResponseEntity.ok(Collections.singletonMap("message", "Feedback saved successfully"));

    }

    public List<FeedbackDTO> getUserFeedbacks(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return user.getFeedbacks().stream()
                .map(feedback -> FeedbackDTO.builder()
                        .message(feedback.getMessage())
                        .category(feedback.getCategory())
                        .isRead(feedback.isRead())
                        .status(feedback.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    public List<FeedbackReponse> getAllFeedbacks() {
        List<Feedback> feedbacks = feedbackRepo.findAll();
        return feedbacks.stream()
                .map(feedback -> FeedbackReponse.builder()
                        .id(feedback.getId())
                        .username(feedback.getUser().getUsername())
                        .email(feedback.getUser().getEmail())
                        .date(feedback.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")))
                        .name(feedback.getUser().getName())
                        .message(feedback.getMessage())
                        .category(feedback.getCategory())
                        .isRead(feedback.isRead())
                        .status(feedback.getStatus())
                        .build())
                .collect(Collectors.toList());
    }


    public byte[] generateFeedbacksPdfReport(String username) {
        List<Feedback> feedbacks = feedbackRepo.findByUserUsername(username);
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    
        if (feedbacks.isEmpty()) {
            throw new RuntimeException("No feedbacks found for user: " + username);
        }
    
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
    
        try {
            PdfWriter.getInstance(document, baos);
            document.open();
    
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font textFont = FontFactory.getFont(FontFactory.COURIER, 11);
    
            document.add(new Paragraph("User Feedback Report", titleFont));
            document.add(new Paragraph("Username : " + username, textFont));
            document.add(new Paragraph("Name : " + user.getName(), textFont));
            document.add(new Paragraph("Generated at : " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mma")), textFont));
            document.add(new Paragraph(" "));
    
            for (Feedback fb : feedbacks) {
                document.add(new Paragraph(String.format(
                    "%-12s: %s", "ID", fb.getId()), textFont));
                document.add(new Paragraph(String.format(
                    "%-12s: %s", "Category", fb.getCategory()), textFont));
                document.add(new Paragraph(String.format(
                    "%-12s: %s", "Status", fb.getStatus()), textFont));
                document.add(new Paragraph(String.format(
                    "%-12s: %s", "Date", fb.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mma"))), textFont));
                document.add(new Paragraph("Feedback : " + fb.getMessage(), textFont));
                document.add(new Paragraph("Answer : " + (fb.getAnswer() != null ? fb.getAnswer() : "Not replied"), textFont));
                document.add(new Paragraph("------------------------------------------------------------"));
            }
    
            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating feedback PDF", e);
        }
    
        return baos.toByteArray();
    }
    
    public byte[] generateFeedbacksCsvReport(String username) {
        List<Feedback> feedbacks = feedbackRepo.findByUserUsername(username);
    
        if (feedbacks.isEmpty()) {
            throw new RuntimeException("No feedbacks found for user: " + username);
        }
    
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Category,Status,Date,Message,Answer\n");
    
        for (Feedback fb : feedbacks) {
            sb.append(String.format("\"%d\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                    fb.getId(),
                    fb.getCategory(),
                    fb.getStatus(),
                    fb.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mma")),
                    fb.getMessage().replace("\"", "'"),
                    fb.getAnswer() != null ? fb.getAnswer().replace("\"", "'") : "Not replied"
            ));
        }
    
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
    


    public ResponseEntity<String> updateFeedbackStatus(Long feedbackId, String status) {
        Feedback feedback = feedbackRepo.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
        
        feedback.setStatus(status);
        feedbackRepo.save(feedback);
        
        return ResponseEntity.ok("Feedback status updated successfully");
    }

    public ResponseEntity<List<Map<String,Object>>> getAllTransaction() {
        List<A2ATransfer> a2aTransfers = a2aRepo.findAll();
        List<QRCode> qrCodes = qrCodeRepo.findAll();

        List<Map<String, Object>> transactions = new ArrayList<>();

        for (A2ATransfer transfer : a2aTransfers) {
            Map<String, Object> tx = new HashMap<>();
            if (transfer.getAccountDebit() != null && transfer.getAccountDebit().getCustomer() != null) {
                tx.put("sender", transfer.getAccountDebit().getCustomer().getName());
            } else {
                tx.put("sender", "N/A");
            }
            if (transfer.getAccountCredit() != null && transfer.getAccountCredit().getCustomer() != null) {
                tx.put("recipient", transfer.getAccountCredit().getCustomer().getName());
            } else {
                tx.put("recipient", "N/A");
            }
            tx.put("amount", transfer.getAmount());
            tx.put("status", transfer.getTransactionStatus().name());
            tx.put("type", transfer.getTransactionType().name());
            tx.put("date", transfer.getDateTransaction().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")));
            transactions.add(tx);
        }

        for (QRCode qr : qrCodes) {
            Map<String, Object> tx = new HashMap<>();
            tx.put("sender", qr.getSender() != null ? qr.getSender().getCustomer().getName() : "N/A");
            tx.put("recipient", qr.getReceiver().getCustomer().getName());
            tx.put("amount", qr.getAmount());
            tx.put("status", qr.getTransactionStatus().name());
            tx.put("type", qr.getTransactionType().name());
            tx.put("date", qr.getDateTransaction().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")));
            transactions.add(tx);
        }

        return ResponseEntity.ok(transactions);
    }

    public void respondToFeedback(Long feedbackId, String response, String status) {
        Feedback feedback = feedbackRepo.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
        
        System.out.println("Feedback is : " + feedback);
        
        feedback.setAnswer(response);
        feedback.setStatus(status);
        feedback.setRead(true);

        System.out.println("Changed Feedback : "+ feedback);
        
        feedbackRepo.save(feedback);
    }

    public List<FeedbackReponse> getUserFeedback(String username){
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
        List<Feedback> feedbacks = user.getFeedbacks();

        return feedbacks.stream()
                .map(feedback -> FeedbackReponse.builder()
                        .id(feedback.getId())
                        .message(feedback.getMessage())
                        .category(feedback.getCategory())
                        .isRead(feedback.isRead())
                        .date(feedback.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")))
                        .status(feedback.getStatus())
                        .build())
                .collect(Collectors.toList()); 
    }
}
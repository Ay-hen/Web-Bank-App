package demo.demo.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

import jakarta.persistence.EntityNotFoundException;

import demo.demo.auth.PermissionResponse;
import demo.demo.dto.CustomerResponse;
import demo.demo.model.A2ATransfer;
import demo.demo.model.Account;
import demo.demo.model.ActivityTracking;
import demo.demo.model.Customer;
import demo.demo.model.Permission;
import demo.demo.model.QRCode;
import demo.demo.model.User;

import demo.demo.repository.PermissionRepo;
import demo.demo.repository.QRCodeRepo;
import demo.demo.repository.UserRepo;
import demo.demo.repository.A2ATransferRepo;
import demo.demo.repository.ActivityTrackingRepo;
import demo.demo.repository.CustomerRepo;

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
                    .amount(account != null ? account.getAmount() : BigDecimal.ZERO)
                    .createdDate(customer.getCreationDate())
                    .status(account != null ? account.getAccountStatus() : "N/A")
                    .build();
        }).collect(Collectors.toList());
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
        reportData.put("amount", account != null ? account.getAmount() : BigDecimal.ZERO);
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

            document.add(new Paragraph("Customer Report", titleFont));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Name: " + customer.getName(), normalFont));
            document.add(new Paragraph("Email: " + customer.getEmail()));
            document.add(new Paragraph("CIN: " + customer.getCin()));
            document.add(new Paragraph("Phone: " + customer.getPhoneNumber()));
            document.add(new Paragraph("Birthday: " + customer.getBirthday()));
            document.add(new Paragraph("Security Q&A: " + customer.getSecurityQuestion() + " / " + customer.getAnswer()));
            if (account != null) {
                document.add(new Paragraph("RIB: " + account.getRib()));
                document.add(new Paragraph("Amount: " + account.getAmount()));
            }
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Activities:", titleFont));
            for (ActivityTracking activity : activities) {
                document.add(new Paragraph("- " + activity.getOperationType() + " on " + activity.getOperationDate()));
            }

            List<Map<String, Object>> transactions = getUserTransactions(id);

            document.add(new Paragraph(" "));
            document.add(new Paragraph("Transactions:", titleFont));
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
                csvPrinter.printRecord("Amount", account.getAmount());
                csvPrinter.printRecord("Currency", account.getAccountCurrency());
            }

            csvPrinter.println();
            csvPrinter.printRecord("Activity Date", "Operation Type", "Description");

            for (ActivityTracking activity : activities) {
                csvPrinter.printRecord(activity.getOperationDate(), activity.getOperationType(), activity.getOperationDescription());
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

    public List<Map<String, Object>> getAllTransactions() {
        List<Map<String, Object>> transactions = new ArrayList<>();

        List<A2ATransfer> a2aTransfers = a2aTransferRepo.findAll();
        for (A2ATransfer transfer : a2aTransfers) {
            Map<String, Object> tx = new HashMap<>();
            tx.put("sender", transfer.getAccountDebit().getCustomer().getName());
            tx.put("recipient", transfer.getAccountCredit().getCustomer().getName());
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
        Customer customer = customerRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
    
        Account account = customer.getAccount();
        if (account == null) return Collections.emptyList();
    
        List<Map<String, Object>> transactions = new ArrayList<>();
    
        List<A2ATransfer> a2aTransfers = a2aTransferRepo.findByAccountDebitOrAccountCredit(account, account);
        for (A2ATransfer tx : a2aTransfers) {
            Map<String, Object> map = new HashMap<>();
            map.put("type", tx.getTransactionType().name());
            map.put("status", tx.getTransactionStatus().name());
            map.put("amount", tx.getAmount());
            map.put("date", tx.getDateTransaction().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")));
            map.put("direction", tx.getAccountDebit().equals(account) ? "Sent" : "Received");
            transactions.add(map);
        }
    
        List<QRCode> qrCodes = qrCodeRepo.findBySenderOrReceiver(account, account);
        for (QRCode tx : qrCodes) {
            Map<String, Object> map = new HashMap<>();
            map.put("type", tx.getTransactionType().name());
            map.put("status", tx.getTransactionStatus().name());
            map.put("amount", tx.getAmount());
            map.put("date", tx.getDateTransaction().format(DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")));
            map.put("direction", tx.getSender() != null && tx.getSender().equals(account) ? "Sent" : "Received");
            transactions.add(map);
        }
    
        return transactions;
    }
    

}

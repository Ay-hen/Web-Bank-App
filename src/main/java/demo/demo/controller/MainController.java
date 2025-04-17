package demo.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ContentDisposition;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import demo.demo.dto.CustomerResponse;
import demo.demo.service.UserService;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:4200/")
public class MainController {

    @Autowired
    private UserService userService;

    @GetMapping("/permissions")
    public String getPermissions() {
        return "Permissions list";
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
        byte[] pdfBytes = userService.generateCustomerPdfReport(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename("report.pdf").build());

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
}

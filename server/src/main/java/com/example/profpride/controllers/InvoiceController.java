package com.example.profpride.controllers;

import com.example.profpride.models.Invoice;
import com.example.profpride.services.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@RequestBody Invoice invoice) {
        Invoice savedInvoice = invoiceService.createInvoice(invoice);
        return new ResponseEntity<>(savedInvoice, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        List<Invoice> invoices = invoiceService.getAllInvoices();
        return new ResponseEntity<>(invoices, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        Optional<Invoice> invoice = invoiceService.getInvoiceById(id);
        if (invoice.isPresent()) {
            return new ResponseEntity<>(invoice.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable Long id, @RequestBody Invoice updatedInvoice) {
        try {
            Invoice savedInvoice = invoiceService.updateInvoice(id, updatedInvoice);
            return new ResponseEntity<>(savedInvoice, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        try {
            invoiceService.deleteInvoice(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Invoice>> getInvoicesByBooking(@PathVariable Long bookingId) {
        List<Invoice> invoices = invoiceService.getInvoicesByBookingId(bookingId);
        return new ResponseEntity<>(invoices, HttpStatus.OK);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<String> downloadInvoice(@PathVariable Long id) {
        try {
            String downloadUrl = invoiceService.generateInvoiceDownloadUrl(id);
            return new ResponseEntity<>(downloadUrl, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{bookingId}/preview")
    public ResponseEntity<String> previewInvoice(@PathVariable Long bookingId) {
        try {
            String htmlContent = invoiceService.generateInvoicePreview(bookingId);
            return new ResponseEntity<>(htmlContent, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/{bookingId}/download")
    public ResponseEntity<byte[]> downloadInvoiceByBooking(@PathVariable Long bookingId) {
        try {
            byte[] pdfBytes = invoiceService.generateInvoicePdf(bookingId);
            return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=invoice_" + bookingId + ".pdf")
                .body(pdfBytes);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}

package com.example.profpride.services;

import com.example.profpride.models.Invoice;
import com.example.profpride.models.Booking;
import com.example.profpride.models.Customer;
import com.example.profpride.models.Room;
import com.example.profpride.models.Payment;
import com.example.profpride.repositories.InvoiceRepository;
import com.example.profpride.repositories.BookingRepository;
import com.example.profpride.repositories.CustomerRepository;
import com.example.profpride.repositories.RoomRepository;
import com.example.profpride.repositories.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public Invoice createInvoice(Invoice invoice) {
        return invoiceRepository.save(invoice);
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public Optional<Invoice> getInvoiceById(Long id) {
        return invoiceRepository.findById(id);
    }

    public Invoice updateInvoice(Long id, Invoice updatedInvoice) {
        if (invoiceRepository.existsById(id)) {
            updatedInvoice.setId(id);
            return invoiceRepository.save(updatedInvoice);
        } else {
            throw new RuntimeException("Invoice not found with id: " + id);
        }
    }

    public void deleteInvoice(Long id) {
        if (invoiceRepository.existsById(id)) {
            invoiceRepository.deleteById(id);
        } else {
            throw new RuntimeException("Invoice not found with id: " + id);
        }
    }

    public List<Invoice> getInvoicesByBookingId(Long bookingId) {
        return invoiceRepository.findByBookingId(bookingId);
    }

    public String generateInvoiceDownloadUrl(Long invoiceId) {
        // For now, return a placeholder URL
        // In a real implementation, this would generate a PDF and return a download URL
        return "https://example.com/invoices/" + invoiceId + ".pdf";
    }

    public String generateInvoicePreview(Long bookingId) {
        try {
            Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
            if (!bookingOpt.isPresent()) {
                throw new RuntimeException("Booking not found with id: " + bookingId);
            }

            Booking booking = bookingOpt.get();
            Customer customer = customerRepository.findByPhoneNumber(booking.getCustomerPhoneNumber());
            Room room = roomRepository.findById(booking.getRoomId()).orElse(null);

            String customerName = customer != null ? customer.getName() : "Unknown Customer";
            String roomNumber = room != null ? room.getRoomNumber() : "Unknown Room";

            // Calculate payment breakdown
            List<Payment> payments = paymentRepository.findByBookingId(bookingId);
            BigDecimal totalPaid = payments.stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal dueAmount = booking.getTotalAmount().subtract(totalPaid);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String checkInDate = booking.getCheckInDate().format(formatter);
            String checkOutDate = booking.getCheckOutDate().format(formatter);

            String html = "<!DOCTYPE html>" +
                "<html><head><title>Professional Pride Invoice</title>" +
                "<style>" +
                "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }" +
                ".invoice-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }" +
                ".invoice-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }" +
                ".invoice-header h1 { margin: 0; font-size: 2.5em; font-weight: 300; letter-spacing: 2px; }" +
                ".invoice-header .subtitle { margin: 10px 0 0 0; font-size: 1.1em; opacity: 0.9; }" +
                ".invoice-content { padding: 40px; }" +
                ".invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px; }" +
                ".invoice-meta div { flex: 1; }" +
                ".invoice-meta h3 { margin: 0 0 10px 0; color: #667eea; font-size: 1.1em; }" +
                ".invoice-meta p { margin: 5px 0; color: #666; }" +
                ".invoice-table { width: 100%; border-collapse: collapse; margin: 30px 0; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }" +
                ".invoice-table th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: left; font-weight: 500; }" +
                ".invoice-table td { padding: 15px; border-bottom: 1px solid #eee; }" +
                ".invoice-table tr:hover { background: #f8f9fa; }" +
                ".total-row { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: bold; font-size: 1.2em; }" +
                ".total-row td { border: none; }" +
                ".invoice-footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 3px solid #667eea; }" +
                ".invoice-footer h3 { color: #667eea; margin: 0 0 10px 0; }" +
                ".invoice-footer p { color: #666; margin: 5px 0; }" +
                ".logo { font-size: 3em; margin-bottom: 10px; }" +
                ".status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; font-weight: 500; }" +
                ".status-confirmed { background: #d4edda; color: #155724; }" +
                ".status-pending { background: #fff3cd; color: #856404; }" +
                ".status-checkedout { background: #cce5ff; color: #004085; }" +
                ".status-checkedin { background: #d1ecf1; color: #0c5460; }" +
                "</style></head><body>" +
                "<div class='invoice-container'>" +
                "<div class='invoice-header'>" +
                "<div class='logo'>🏨</div>" +
                "<h1>PROFESSIONAL PRIDE</h1>" +
                "<p class='subtitle'>Premium Room Booking Services</p>" +
                "</div>" +
                "<div class='invoice-content'>" +
                "<div class='invoice-meta'>" +
                "<div>" +
                "<h3>Invoice Details</h3>" +
                "<p><strong>Invoice #:</strong> INV-" + String.format("%06d", bookingId) + "</p>" +
                "<p><strong>Date:</strong> " + LocalDateTime.now().format(formatter) + "</p>" +
                "<p><strong>Booking ID:</strong> " + bookingId + "</p>" +
                "</div>" +
                "<div>" +
                "<h3>Customer Information</h3>" +
                "<p><strong>Name:</strong> " + customerName + "</p>" +
                "<p><strong>Phone:</strong> " + booking.getCustomerPhoneNumber() + "</p>" +
                "<p><strong>Room:</strong> " + roomNumber + "</p>" +
                "</div>" +
                "<div>" +
                "<h3>Booking Details</h3>" +
                "<p><strong>Check-in:</strong> " + checkInDate + "</p>" +
                "<p><strong>Check-out:</strong> " + checkOutDate + "</p>" +
                "<p><strong>Status:</strong> <span class='status-badge status-" + booking.getBookingStatus().name().toLowerCase() + "'>" + booking.getBookingStatus().name() + "</span></p>" +
                "</div>" +
                "</div>" +
                "<table class='invoice-table'>" +
                "<thead><tr><th>Description</th><th>Duration</th><th>Rate</th><th>Amount</th></tr></thead>" +
                "<tbody>" +
                "<tr>" +
                "<td>Room " + roomNumber + " - " + booking.getBookingDurationType() + " Booking</td>" +
                "<td>" + (booking.getBookingDurationType().equals("DAILY") ? 
                    java.time.temporal.ChronoUnit.DAYS.between(booking.getCheckInDate().toLocalDate(), booking.getCheckOutDate().toLocalDate()) + " days" : 
                    "1 month") + "</td>" +
                "<td>₹" + (booking.getBookingDurationType().equals("DAILY") ? booking.getDailyCost() : booking.getMonthlyCost()) + "</td>" +
                "<td>₹" + booking.getTotalAmount() + "</td>" +
                "</tr>" +
                (booking.getEarlyCheckinCost().compareTo(java.math.BigDecimal.ZERO) > 0 ? 
                    "<tr><td>Early Check-in Fee</td><td>-</td><td>₹" + booking.getEarlyCheckinCost() + "</td><td>₹" + booking.getEarlyCheckinCost() + "</td></tr>" : "") +
                "<tr class='total-row'>" +
                "<td colspan='3'><strong>Total Amount</strong></td>" +
                "<td><strong>₹" + booking.getTotalAmount() + "</strong></td>" +
                "</tr>" +
                "</tbody></table>" +
                
                // Payment Breakdown Section
                "<div style='margin-top: 30px;'>" +
                "<h3 style='color: #667eea; margin-bottom: 15px;'>Payment Breakdown</h3>" +
                "<table class='invoice-table'>" +
                "<thead><tr><th>Payment Date</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>" +
                "<tbody>" +
                (payments.isEmpty() ? 
                    "<tr><td colspan='4' style='text-align: center; color: #666; font-style: italic;'>No payments recorded</td></tr>" :
                    payments.stream().map(payment -> 
                        "<tr>" +
                        "<td>" + (payment.getPaymentDate() != null ? payment.getPaymentDate().format(formatter) : "N/A") + "</td>" +
                        "<td>₹" + payment.getAmount() + "</td>" +
                        "<td>" + payment.getPaymentMethod() + "</td>" +
                        "<td><span class='status-badge status-" + payment.getPaymentStatus().name().toLowerCase() + "'>" + payment.getPaymentStatus().name() + "</span></td>" +
                        "</tr>"
                    ).reduce("", String::concat)
                ) +
                "</tbody></table>" +
                
                // Payment Summary
                "<div style='margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 10px;'>" +
                "<div style='display: flex; justify-content: space-between; margin-bottom: 10px;'>" +
                "<span><strong>Total Amount:</strong></span>" +
                "<span><strong>₹" + booking.getTotalAmount() + "</strong></span>" +
                "</div>" +
                "<div style='display: flex; justify-content: space-between; margin-bottom: 10px;'>" +
                "<span><strong>Total Paid:</strong></span>" +
                "<span style='color: #28a745;'><strong>₹" + totalPaid + "</strong></span>" +
                "</div>" +
                "<div style='display: flex; justify-content: space-between; margin-bottom: 10px; border-top: 2px solid #667eea; padding-top: 10px;'>" +
                "<span><strong>Due Amount:</strong></span>" +
                "<span style='color: " + (dueAmount.compareTo(BigDecimal.ZERO) > 0 ? "#dc3545" : "#28a745") + "; font-size: 1.2em;'><strong>₹" + dueAmount + "</strong></span>" +
                "</div>" +
                "<div style='display: flex; justify-content: space-between;'>" +
                "<span><strong>Payment Count:</strong></span>" +
                "<span><strong>" + payments.size() + " payment(s)</strong></span>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "<div class='invoice-footer'>" +
                "<h3>Thank You for Choosing Professional Pride!</h3>" +
                "<p>We appreciate your business and look forward to serving you again.</p>" +
                "<p>For any queries, please contact us at: +91-XXXX-XXXXXX</p>" +
                "<p style='margin-top: 20px; font-size: 0.9em; color: #999;'>This is a computer-generated invoice. No signature required.</p>" +
                "</div>" +
                "</div>" +
                "</body></html>";

            return html;
        } catch (Exception e) {
            throw new RuntimeException("Error generating invoice preview: " + e.getMessage());
        }
    }

    public byte[] generateInvoicePdf(Long bookingId) {
        try {
            // For now, return a simple PDF-like response
            // In a real implementation, you would use a PDF library like iText or Apache PDFBox
            String htmlContent = generateInvoicePreview(bookingId);
            
            // Convert HTML to PDF bytes (simplified - in real implementation use proper PDF library)
            String pdfContent = "%PDF-1.4\n" +
                "1 0 obj\n" +
                "<<\n" +
                "/Type /Catalog\n" +
                "/Pages 2 0 R\n" +
                ">>\n" +
                "endobj\n" +
                "2 0 obj\n" +
                "<<\n" +
                "/Type /Pages\n" +
                "/Kids [3 0 R]\n" +
                "/Count 1\n" +
                ">>\n" +
                "endobj\n" +
                "3 0 obj\n" +
                "<<\n" +
                "/Type /Page\n" +
                "/Parent 2 0 R\n" +
                "/MediaBox [0 0 612 792]\n" +
                "/Contents 4 0 R\n" +
                ">>\n" +
                "endobj\n" +
                "4 0 obj\n" +
                "<<\n" +
                "/Length 44\n" +
                ">>\n" +
                "stream\n" +
                "BT\n" +
                "/F1 12 Tf\n" +
                "72 720 Td\n" +
                "(Invoice for Booking " + bookingId + ") Tj\n" +
                "ET\n" +
                "endstream\n" +
                "endobj\n" +
                "xref\n" +
                "0 5\n" +
                "0000000000 65535 f \n" +
                "0000000009 00000 n \n" +
                "0000000058 00000 n \n" +
                "0000000115 00000 n \n" +
                "0000000204 00000 n \n" +
                "trailer\n" +
                "<<\n" +
                "/Size 5\n" +
                "/Root 1 0 R\n" +
                ">>\n" +
                "startxref\n" +
                "298\n" +
                "%%EOF";
            
            return pdfContent.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Error generating invoice PDF: " + e.getMessage());
        }
    }
}

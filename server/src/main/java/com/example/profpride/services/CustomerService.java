package com.example.profpride.services;

import com.example.profpride.models.Customer;
import com.example.profpride.models.Booking;
import com.example.profpride.repositories.CustomerRepository;
import com.example.profpride.repositories.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public Customer createCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerByPhoneNumber(String phoneNumber) {
        return customerRepository.findById(phoneNumber);
    }

    public Customer updateCustomer(String phoneNumber, Customer updatedCustomer) {
        return customerRepository.findById(phoneNumber).map(customer -> {
            // If phone number is being changed, we need to handle it specially
            if (!phoneNumber.equals(updatedCustomer.getPhoneNumber())) {
                // Check if new phone number already exists
                if (customerRepository.existsById(updatedCustomer.getPhoneNumber())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer with phone number " + updatedCustomer.getPhoneNumber() + " already exists");
                }
                
                // Create new customer with new phone number
                Customer newCustomer = new Customer();
                newCustomer.setPhoneNumber(updatedCustomer.getPhoneNumber());
                newCustomer.setName(updatedCustomer.getName());
                newCustomer.setEmail(updatedCustomer.getEmail());
                newCustomer.setPassword(customer.getPassword()); // Keep existing password
                newCustomer.setAdditionalPhoneNumber(updatedCustomer.getAdditionalPhoneNumber());
                newCustomer.setDocumentsFolderLink(updatedCustomer.getDocumentsFolderLink());
                newCustomer.setPhotoIdProofUrl(updatedCustomer.getPhotoIdProofUrl());
                newCustomer.setIdProofUrls(customer.getIdProofUrls()); // Keep existing ID proofs
                newCustomer.setRemarks(updatedCustomer.getRemarks());
                newCustomer.setCreatedAt(customer.getCreatedAt()); // Keep original creation date
                newCustomer.setUpdatedAt(java.time.LocalDateTime.now());
                
                // Save new customer and delete old one
                Customer savedCustomer = customerRepository.save(newCustomer);
                customerRepository.deleteById(phoneNumber);
                return savedCustomer;
            } else {
                // Normal update without phone number change
                customer.setName(updatedCustomer.getName());
                customer.setEmail(updatedCustomer.getEmail());
                customer.setAdditionalPhoneNumber(updatedCustomer.getAdditionalPhoneNumber());
                customer.setDocumentsFolderLink(updatedCustomer.getDocumentsFolderLink());
                customer.setPhotoIdProofUrl(updatedCustomer.getPhotoIdProofUrl());
                customer.setRemarks(updatedCustomer.getRemarks());
                customer.setUpdatedAt(java.time.LocalDateTime.now());
                return customerRepository.save(customer);
            }
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    public Customer updateCustomerProfile(String phoneNumber, Map<String, String> profileData) {
        return customerRepository.findById(phoneNumber).map(customer -> {
            if (profileData.containsKey("name")) {
                customer.setName(profileData.get("name"));
            }
            if (profileData.containsKey("additionalPhoneNumber")) {
                customer.setAdditionalPhoneNumber(profileData.get("additionalPhoneNumber"));
            }
            if (profileData.containsKey("remarks")) {
                customer.setRemarks(profileData.get("remarks"));
            }
            return customerRepository.save(customer);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    public Customer updateCustomerPhotoIdUrl(String phoneNumber, String photoIdUrl) {
        return customerRepository.findById(phoneNumber).map(customer -> {
            customer.setPhotoIdProofUrl(photoIdUrl);
            return customerRepository.save(customer);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    public Customer updateCustomerIdProofUrls(String phoneNumber, List<String> idProofUrls) {
        return customerRepository.findById(phoneNumber).map(customer -> {
            customer.setIdProofUrls(idProofUrls);
            return customerRepository.save(customer);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    public List<Booking> getCustomerBookings(String phoneNumber) {
        return bookingRepository.findByCustomerPhoneNumber(phoneNumber);
    }

    public boolean customerExists(String phoneNumber) {
        return customerRepository.existsById(phoneNumber);
    }

    public boolean deleteCustomer(String phoneNumber) {
        if (customerRepository.existsById(phoneNumber)) {
            customerRepository.deleteById(phoneNumber);
            return true;
        }
        return false;
    }

    public boolean validateCustomerCredentials(String phoneNumber, String password) {
        return customerRepository.findById(phoneNumber)
                .map(customer -> password.equals(customer.getPassword()))
                .orElse(false);
    }
}

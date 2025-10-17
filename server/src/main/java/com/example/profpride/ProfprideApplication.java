package com.example.profpride;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = {org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class})
public class ProfprideApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProfprideApplication.class, args);
    }

}

package edu.project.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

/**
 *
 * @author Dev
 */
@SpringBootApplication
@ComponentScan(basePackages = {"controller", "config", "security", "service"})
public class Backend {
    public static void main(String[] args) {
        SpringApplication.run(Backend.class, args);
    }
}

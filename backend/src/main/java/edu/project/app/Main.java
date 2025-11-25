package edu.project.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

/**
 * Main entry point for the Secure Video Streamer Spring Boot Application.
 */
@SpringBootApplication
@ComponentScan(basePackages = {"controller", "config", "security", "service"})
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}

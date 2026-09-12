package com.notesforall;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class NotesForAllApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotesForAllApplication.class, args);
    }

    @Bean
    public CommandLineRunner databaseMigration(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT TRUE");
            } catch (Exception ignored) {
                // Table does not exist yet (Hibernate will create it) or already has column
            }
        };
    }
}

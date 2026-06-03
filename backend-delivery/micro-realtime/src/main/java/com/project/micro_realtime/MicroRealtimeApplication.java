package com.project.micro_realtime;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableScheduling
@EnableMongoRepositories(basePackages = "com.project.micro_realtime.repository")
@EnableJpaRepositories(basePackages = "com.project.micro_realtime.repository")
@EnableFeignClients
@EnableJpaAuditing
public class MicroRealtimeApplication {

	public static void main(String[] args) {
		SpringApplication.run(MicroRealtimeApplication.class, args);
	}

}

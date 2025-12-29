package com.project.micro_payments;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class MicroPaymentsApplication {

	public static void main(String[] args) {
		SpringApplication.run(MicroPaymentsApplication.class, args);
	}

}

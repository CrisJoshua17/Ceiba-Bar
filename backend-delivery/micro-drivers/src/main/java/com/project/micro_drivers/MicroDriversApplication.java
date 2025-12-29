package com.project.micro_drivers;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class MicroDriversApplication {

	public static void main(String[] args) {
		SpringApplication.run(MicroDriversApplication.class, args);
	}

}

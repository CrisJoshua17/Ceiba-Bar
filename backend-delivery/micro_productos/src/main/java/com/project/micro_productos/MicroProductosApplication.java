package com.project.micro_productos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class MicroProductosApplication {

	public static void main(String[] args) {
		SpringApplication.run(MicroProductosApplication.class, args);
	}

}

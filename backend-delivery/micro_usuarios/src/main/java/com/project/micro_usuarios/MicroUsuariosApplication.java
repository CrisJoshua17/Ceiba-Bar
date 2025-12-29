package com.project.micro_usuarios;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class MicroUsuariosApplication {

	public static void main(String[] args) {
		SpringApplication.run(MicroUsuariosApplication.class, args);
	}

}

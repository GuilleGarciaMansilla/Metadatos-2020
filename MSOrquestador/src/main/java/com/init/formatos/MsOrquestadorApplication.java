package com.init.formatos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@EnableJpaRepositories(basePackages = "com.init.formatos.dao")
@SpringBootApplication
public class MsOrquestadorApplication {

	public static void main(String[] args) {
		SpringApplication.run(MsOrquestadorApplication.class, args);
	}

}

package com.project.micro_realtime.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
public class CorsConfig implements WebFluxConfigurer{

    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
        .allowedOrigins("http://localhost:4200")
        .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true)
        .maxAge(3600);
    }
    
        // @Bean
        // public CorsWebFilter corsWebFilter(){
        //     CorsConfiguration corsConfig = new CorsConfiguration();
        //     corsConfig.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        //     corsConfig.setAllowedMethods(Arrays.asList("GET","POST","PUT","DELETE","OPTIONS"));
        //     corsConfig.setAllowedHeaders(Arrays.asList("*"));
        //     corsConfig.setAllowCredentials(true);
        //     corsConfig.setMaxAge(3600L);

        //     UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        //     source.registerCorsConfiguration("/**", corsConfig);

        //     return new CorsWebFilter(source);
        // }

}

package com.rakshasphere.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${FRONTEND_URL:https://raksha-sphere-version10.vercel.app}")
    private String frontendUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);

        String cleanFrontendUrl = frontendUrl != null ? frontendUrl.replaceAll("/+$", "") : "";

        List<String> allowedOrigins = new ArrayList<>(Arrays.asList(
            "https://raksha-sphere-version10.vercel.app",
            "https://raksha-sphere-*.vercel.app",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8080",
            "https://localhost:3000"
        ));

        if (StringUtils.hasText(cleanFrontendUrl) && !allowedOrigins.contains(cleanFrontendUrl)) {
            allowedOrigins.add(cleanFrontendUrl);
        }

        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedHeaders(Arrays.asList("Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }
}

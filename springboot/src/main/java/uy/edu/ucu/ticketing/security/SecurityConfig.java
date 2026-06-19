package uy.edu.ucu.ticketing.security;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity   // habilita @PreAuthorize
public class SecurityConfig {

    private final JwtAuthFilter jwtFilter;
    public SecurityConfig(JwtAuthFilter jwtFilter) { this.jwtFilter = jwtFilter; }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Frontend estatico (SPA servida por el mismo backend: sin CORS)
                .requestMatchers(HttpMethod.GET, "/", "/index.html", "/app.js", "/styles.css",
                        "/favicon.ico", "/manifest.webmanifest").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                // RBAC por endpoint (complementa los @PreAuthorize de cada controller)
                .requestMatchers("/api/compras/**").hasRole("USUARIO_GENERAL")
                .requestMatchers("/api/transferencias/**").hasRole("USUARIO_GENERAL")
                .requestMatchers("/api/usuarios/**").hasRole("USUARIO_GENERAL")
                .requestMatchers("/api/validaciones/**").hasRole("FUNCIONARIO_VALIDACION")
                .requestMatchers("/api/estadios/**").hasRole("ADMINISTRADOR_PAIS")
                .requestMatchers("/api/eventos/**").hasRole("ADMINISTRADOR_PAIS")
                .requestMatchers("/api/reportes/**").hasRole("ADMINISTRADOR_PAIS")
                .anyRequest().authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}

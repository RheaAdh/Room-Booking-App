package com.example.profpride.security;

import com.example.profpride.utils.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            
            try {
                if (jwtUtils.isTokenValid(token) && !jwtUtils.isTokenExpired(token)) {
                    String userId = jwtUtils.extractUserId(token);
                    String role = jwtUtils.extractRole(token);
                    String name = jwtUtils.extractName(token);
                    
                    // Create authentication object
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        userId, 
                        null, 
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                    
                    // Set additional details
                    auth.setDetails(Map.of("role", role, "name", name));
                    
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                // Token is invalid, continue without authentication
                SecurityContextHolder.clearContext();
            }
        }
        
        filterChain.doFilter(request, response);
    }
}

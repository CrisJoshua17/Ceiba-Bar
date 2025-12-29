package com.project.micro_auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

@Service
public class JwtService {
 
    @Value("${jwt.secret:supersecretkey123supersecretkey123supersecretkey123}")
    private String secretKey;

     @Value("${jwt.expiration:86400000}") // 24 horas en milisegundos
     private long expiration;

     private Key getSigningKey(){
        return Keys.hmacShaKeyFor(secretKey.getBytes());
     }

      // Genera un JWT con email, userId y roles
      public String generateToken(String email, List<String>roles){
        return generateToken(email, roles, null);  
      }

      public String generateToken(String email, List<String> roles, Long userId){
        return Jwts.builder()
        .setSubject(email)
        .claim("roles", roles)
        .claim("userId", userId)
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis()+expiration))
        .signWith(getSigningKey(),SignatureAlgorithm.HS256)
        .compact();
      }

      // Valida un token JWT
      public boolean validateToken(String token){
        try {
            Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    
      }

 // Extraer el email del token
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extraer roles del token
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return extractClaim(token, claims -> claims.get("roles", List.class));
    }

    // Extraer userId del token
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("userId", Long.class));
    }

    // Extraer expiración del token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Método genérico para extraer claims
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Verificar si el token ha expirado
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
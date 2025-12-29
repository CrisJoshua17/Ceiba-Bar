package com.project.micro_auth.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;


@Component
public class LoginAttemptService {
    
    private final int MAX_ATTEMPTS = 5;
    private final long LOCK_TIME_DURATION = 15 * 60 * 1000; // 15 minutos en milisegundos

     private Map<String, LoginAttempt> attemptsCache = new ConcurrentHashMap<>();


 public void loginFailed(String email) {
        LoginAttempt attempt = attemptsCache.getOrDefault(email, new LoginAttempt());
        attempt.incrementAttempts();
        attempt.setLastAttempt(System.currentTimeMillis());
        attemptsCache.put(email, attempt);
    }
    
    public void loginSuccess(String email) {
        attemptsCache.remove(email);
    }
    
    public boolean isBlocked(String email) {
        LoginAttempt attempt = attemptsCache.get(email);
        if (attempt == null) {
            return false;
        }
        
        if (attempt.getAttempts() >= MAX_ATTEMPTS && 
            (System.currentTimeMillis() - attempt.getLastAttempt()) < LOCK_TIME_DURATION) {
            return true;
        }
        
        // Si pasó el tiempo de bloqueo, resetear
        if (attempt.getAttempts() >= MAX_ATTEMPTS && 
            (System.currentTimeMillis() - attempt.getLastAttempt()) >= LOCK_TIME_DURATION) {
            attemptsCache.remove(email);
            return false;
        }
        
        return false;
    }
    
    public int getRemainingAttempts(String email) {
        LoginAttempt attempt = attemptsCache.get(email);
        if (attempt == null) {
            return MAX_ATTEMPTS;
        }
        return Math.max(0, MAX_ATTEMPTS - attempt.getAttempts());
    }
    
    public long getBlockTimeRemaining(String email) {
        LoginAttempt attempt = attemptsCache.get(email);
        if (attempt == null || attempt.getAttempts() < MAX_ATTEMPTS) {
            return 0;
        }
        
        long timePassed = System.currentTimeMillis() - attempt.getLastAttempt();
        if (timePassed < LOCK_TIME_DURATION) {
            return LOCK_TIME_DURATION - timePassed;
        }
        return 0;
    }




     private static class LoginAttempt {
        private int attempts = 0;
        private long lastAttempt;
        
        public void incrementAttempts() {
            this.attempts++;
        }
        
        public int getAttempts() {
            return attempts;
        }
        
        public long getLastAttempt() {
            return lastAttempt;
        }
        
        public void setLastAttempt(long lastAttempt) {
            this.lastAttempt = lastAttempt;
        }
    }
}

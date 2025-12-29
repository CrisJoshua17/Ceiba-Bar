package com.project.micro_auth.model.dto;

 // Clase interna para información del usuario
import java.util.List;


    public  class UserInfo {
        private String email;
        private Long userId;
        private List<String> roles;

        // Builder pattern
        public static UserInfoBuilder builder() {
            return new UserInfoBuilder();
        }

        // Getters
        public String getEmail() { return email; }
        public Long getUserId() { return userId; }
        public List<String> getRoles() { return roles; }

        // Builder class
        public static class UserInfoBuilder {
            private String email;
            private Long userId;
            private List<String> roles;

            public UserInfoBuilder email(String email) {
                this.email = email;
                return this;
            }

            public UserInfoBuilder userId(Long userId) {
                this.userId = userId;
                return this;
            }

            public UserInfoBuilder roles(List<String> roles) {
                this.roles = roles;
                return this;
            }

            public UserInfo build() {
                UserInfo userInfo = new UserInfo();
                userInfo.email = this.email;
                userInfo.userId = this.userId;
                userInfo.roles = this.roles;
                return userInfo;
            }
        }
    }
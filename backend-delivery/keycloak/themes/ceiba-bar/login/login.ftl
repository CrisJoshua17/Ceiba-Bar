<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=realm.registrationAllowed; section>
    <#if section = "form">
        <h2 class="page-title">${msg("loginAccountTitle")}</h2>
        
        <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
            
            <#-- Campo de Nombre de Usuario / Email -->
            <div class="form-group">
                <label for="username" class="form-label">
                    <#if !realm.loginWithEmailAllowed>
                        ${msg("username")}
                    <#elseif !realm.registrationEmailAsUsername>
                        ${msg("usernameOrEmail")}
                    <#else>
                        ${msg("email")}
                    </#if>
                </label>
                <input tabindex="1" 
                       id="username" 
                       name="username" 
                       value="${(login.username!'')}" 
                       type="text" 
                       class="form-input" 
                       placeholder="${msg('usernameOrEmailPlaceholder', 'correo@ejemplo.com')}"
                       autofocus 
                       autocomplete="off" 
                       required />
            </div>

            <#-- Campo de Contraseña -->
            <div class="form-group password-container">
                <label for="password" class="form-label">${msg("password")}</label>
                <input tabindex="2" 
                       id="password" 
                       name="password" 
                       type="password" 
                       class="form-input" 
                       placeholder="••••••••"
                       autocomplete="off" 
                       required />
                
                <button type="button" id="password-toggle-btn" class="password-toggle" onclick="togglePasswordVisibility()" tabindex="-1">
                    <svg id="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </div>

            <#-- Fila de Acciones: Recordar sesión y Olvidó Contraseña -->
            <div class="form-actions-row">
                <#if realm.rememberMe && !usernameEditDisabled??>
                    <label class="checkbox-label">
                        <#if login.rememberMe??>
                            <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" checked class="checkbox-input" />
                        <#else>
                            <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" class="checkbox-input" />
                        </#if>
                        <span>${msg("rememberMe")}</span>
                    </label>
                </#if>
                
                <#if realm.resetPasswordAllowed>
                    <a tabindex="5" href="${url.loginResetPasswordUrl}" class="link-forgot">${msg("doForgotPassword")}</a>
                </#if>
            </div>

            <#-- Botón de Enviar -->
            <div class="form-group">
                <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                <button tabindex="4" class="btn-primary" name="login" id="kc-login" type="submit">
                    ${msg("doLogIn")}
                </button>
            </div>
        </form>

        <script>
            function togglePasswordVisibility() {
                var passwordInput = document.getElementById("password");
                var eyeIcon = document.getElementById("eye-icon");
                if (passwordInput.type === "password") {
                    passwordInput.type = "text";
                    // Icono de ojo tachado (ocultar)
                    eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
                } else {
                    passwordInput.type = "password";
                    // Icono de ojo abierto (mostrar)
                    eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
                }
            }
        </script>
    <#elseif section = "info">
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <span>¿Nuevo en Ceiba-Bar?</span>
            <a href="${url.registrationUrl}" class="card-footer-link">${msg("doRegister")}</a>
        </#if>
    </#if>
</@layout.registrationLayout>

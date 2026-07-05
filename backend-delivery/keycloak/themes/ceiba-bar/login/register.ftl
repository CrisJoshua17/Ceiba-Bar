<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "form">
        <h2 class="page-title">${msg("registerTitle")}</h2>
        
        <form id="kc-register-form" action="${url.registrationAction}" method="post" onsubmit="register.disabled = true; return true;">
            
            <#-- Fila de Nombre y Apellido (Grid de dos columnas en pantallas anchas) -->
            <div class="form-row">
                <div class="form-group">
                    <label for="firstName" class="form-label">${msg("firstName")}</label>
                    <input type="text" 
                           id="firstName" 
                           name="firstName" 
                           value="${(register.formData.firstName!'')}" 
                           class="form-input" 
                           placeholder="Juan"
                           required />
                </div>
                
                <div class="form-group">
                    <label for="lastName" class="form-label">${msg("lastName")}</label>
                    <input type="text" 
                           id="lastName" 
                           name="lastName" 
                           value="${(register.formData.lastName!'')}" 
                           class="form-input" 
                           placeholder="Pérez"
                           required />
                </div>
            </div>

            <#-- Campo de Email -->
            <div class="form-group">
                <label for="email" class="form-label">${msg("email")}</label>
                <input type="email" 
                       id="email" 
                       name="email" 
                       value="${(register.formData.email!'')}" 
                       class="form-input" 
                       placeholder="correo@ejemplo.com"
                       autocomplete="email" 
                       required />
            </div>

            <#-- Campo de Username (Si el Realm no usa Email como Username) -->
            <#if !realm.registrationEmailAsUsername>
                <div class="form-group">
                    <label for="username" class="form-label">${msg("username")}</label>
                    <input type="text" 
                           id="username" 
                           name="username" 
                           value="${(register.formData.username!'')}" 
                           class="form-input" 
                           placeholder="juan.perez"
                           autocomplete="username" 
                           required />
                </div>
            </#if>

            <#-- Campo de Contraseña -->
            <#if passwordRequired??>
                <div class="form-group password-container">
                    <label for="password" class="form-label">${msg("password")}</label>
                    <input type="password" 
                           id="password" 
                           name="password" 
                           class="form-input" 
                           placeholder="••••••••"
                           autocomplete="new-password" 
                           required />
                </div>

                <#-- Campo de Confirmar Contraseña -->
                <div class="form-group password-container">
                    <label for="password-confirm" class="form-label">${msg("passwordConfirm")}</label>
                    <input type="password" 
                           id="password-confirm" 
                           name="password-confirm" 
                           class="form-input" 
                           placeholder="••••••••"
                           autocomplete="new-password" 
                           required />
                </div>
            </#if>

            <#-- Botón de Enviar -->
            <div class="form-group" style="margin-top: 10px;">
                <button class="btn-primary" name="register" id="kc-register" type="submit">
                    ${msg("doRegister")}
                </button>
            </div>
        </form>
    <#elseif section = "info">
        <span>¿Ya tienes una cuenta?</span>
        <a href="${url.loginUrl}" class="card-footer-link">${msg("backToLogin")}</a>
    </#if>
</@layout.registrationLayout>

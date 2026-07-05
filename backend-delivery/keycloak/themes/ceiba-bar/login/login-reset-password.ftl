<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "form">
        <h2 class="page-title">${msg("emailForgotTitle")}</h2>
        
        <p style="font-size: 14px; color: var(--ceiba-muted); text-align: center; margin-top: -10px; margin-bottom: 24px; line-height: 1.5;">
            Ingresa tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form id="kc-reset-password-form" action="${url.loginAction}" method="post">
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
                <input type="text" 
                       id="username" 
                       name="username" 
                       class="form-input" 
                       placeholder="correo@ejemplo.com"
                       value="${(auth.attemptedUsername!'')}" 
                       autofocus 
                       required />
            </div>

            <div class="form-group" style="margin-top: 10px;">
                <button class="btn-primary" type="submit">
                    ${msg("doSubmit")}
                </button>
            </div>
        </form>
    <#elseif section = "info">
        <a href="${url.loginUrl}" class="card-footer-link" style="margin-left: 0;">${msg("backToLogin")}</a>
    </#if>
</@layout.registrationLayout>

<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false showAnotherWayIfPresent=true>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow">

    <title>${msg("loginTitle",(realm.displayName!'Ceiba-Bar'))}</title>
    
    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />

    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
</head>

<body>
    <div class="login-card">
        <!-- Logo y Encabezado de Marca -->
        <div class="brand-header">
            <div class="brand-logo-container">
                <div class="brand-icon">CB</div>
            </div>
            <h1 class="brand-name">Ceiba-Bar</h1>
            <p class="brand-subtitle">Delivery & Experiencia</p>
        </div>

        <#-- Alertas y Mensajes de Feedback -->
        <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
            <#if message.type = 'error'>
                <div class="alert alert-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>${kcSanitize(message.summary)?no_esc}</span>
                </div>
            <#elseif message.type = 'success'>
                <div class="alert alert-success">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>${kcSanitize(message.summary)?no_esc}</span>
                </div>
            <#else>
                <div class="alert" style="background-color: rgba(94, 107, 119, 0.08); border-color: rgba(94, 107, 119, 0.2); color: var(--ceiba-muted);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>${kcSanitize(message.summary)?no_esc}</span>
                </div>
            </#if>
        </#if>

        <#-- Contenido del Formulario de la Página Específica -->
        <#nested "form">

        <#-- Pie de página e Información adicional si se requiere -->
        <#if displayInfo>
            <div class="card-footer">
                <#nested "info">
            </div>
        </#if>
    </div>
</body>
</html>
</#macro>

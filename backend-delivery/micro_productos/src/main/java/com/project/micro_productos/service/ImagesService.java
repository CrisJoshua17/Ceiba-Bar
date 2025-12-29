package com.project.micro_productos.service;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class ImagesService {

    // Ruta donde se guardarán las imágenes
    private final Path rootLocation = Paths.get("uploads/images");

    // URL base para acceder a las imágenes
    private final String imageBaseUrl = "/images/";

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo crear el directorio para guardar imágenes", e);
        }
    }

    public String saveImage(MultipartFile file) {
        try {
            // Validar que el archivo no esté vacío
            if (file.isEmpty()) {
                throw new RuntimeException("El archivo está vacío");
            }

            // Validar que sea una imagen
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("El archivo no es una imagen válida");
            }

            // Generar nombre único para evitar colisiones
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            // Guardar el archivo
            Path destinationFile = this.rootLocation.resolve(Paths.get(uniqueFileName))
                    .normalize().toAbsolutePath();

            // Verificar que no existe un archivo con el mismo nombre
            if (Files.exists(destinationFile)) {
                throw new RuntimeException("Ya existe un archivo con ese nombre");
            }

            Files.copy(file.getInputStream(), destinationFile);

            // Retornar la URL relativa para acceder a la imagen
            return imageBaseUrl + uniqueFileName;

        } catch (IOException e) {
            throw new RuntimeException("Error al guardar la imagen: " + e.getMessage(), e);
        }
    }

    // Método alias para mantener compatibilidad (usa saveImage internamente)
    public String saveImageToFileSystem(MultipartFile file) {
        return saveImage(file);
    }

    // Método para cargar una imagen como recurso
    public Resource loadImage(String filename) {
        try {
            Path file = rootLocation.resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("No se pudo leer el archivo: " + filename);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }

    // Método para eliminar una imagen
    public boolean deleteImage(String filename) {
        try {
            // Extraer solo el nombre del archivo de la URL
            if (filename.contains("/")) {
                filename = filename.substring(filename.lastIndexOf("/") + 1);
            }

            Path file = rootLocation.resolve(filename);
            return Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new RuntimeException("Error al eliminar la imagen: " + e.getMessage(), e);
        }
    }

    // Método alias para mantener compatibilidad (usa deleteImage internamente)
    public boolean deleteImageFromFileSystem(String filename) {
        return deleteImage(filename);
    }

    // Validar tipos de archivo permitidos
    public boolean isValidImageType(String contentType) {
        return contentType != null &&
                (contentType.equals("image/jpeg") ||
                        contentType.equals("image/png") ||
                        contentType.equals("image/gif") ||
                        contentType.equals("image/webp"));
    }
}
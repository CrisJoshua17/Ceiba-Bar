import { Injectable } from '@angular/core';
import { BASE_PATH_IMAGES_PRODUCTS } from '../utils/enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ImagesService {
  
  constructor() { }
  
  
  private allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private maxSize = 1 * 1024 * 1024; // 1MB

  private galleryImages= [
     { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.43.48-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.43.48-p.m-300x300.jpg', alt: 'Foto 1' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/WhatsApp-Image-2023-04-27-at-12.27.51-PM-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/WhatsApp-Image-2023-04-27-at-12.27.51-PM-300x300.jpg', alt: 'Foto 2' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.43.10-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.43.10-p.m-300x300.jpg', alt: 'Foto 3' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.42.49-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.42.49-p.m-300x300.jpg', alt: 'Foto 4' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.18.37-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.18.37-p.m-300x300.jpg', alt: 'Foto 5' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.18.48-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.18.48-p.m-300x300.jpg', alt: 'Foto 6' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.19.33-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.19.33-p.m-300x300.jpg', alt: 'Foto 7' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.19.44-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.19.44-p.m-300x300.jpg', alt: 'Foto 8' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.41.23-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.41.23-p.m-300x300.jpg', alt: 'Foto 9' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.41.47-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.41.47-p.m-300x300.jpg', alt: 'Foto 10' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.42.05-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.42.05-p.m-300x300.jpg', alt: 'Foto 11' },
    { itemImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.17.39-p.m-300x300.jpg', thumbnailImageSrc: 'https://labbar.mx/wp-content/uploads/2023/09/Captura-de-pantalla-2023-04-29-a-las-8.17.39-p.m-300x300.jpg', alt: 'Foto 12' },
  
  ];


 private historyImages = [
    { 
      itemImageSrc: 'assets/images/historia1.jpg',  
      thumbnailImageSrc: 'assets/images/historia1.jpg', 
      alt: 'FotoH 1' 
    },
    { 
      itemImageSrc: 'assets/images/historia2.jpg', 
      thumbnailImageSrc: 'assets/images/historia2.jpg', 
      alt: 'FotoH 2' 
    },
    { 
      itemImageSrc: 'assets/images/historia3.jpg',  
      thumbnailImageSrc: 'assets/images/historia3.jpg', 
      alt: 'FotoH 3' 
    },
  ];




getGalleryImages(){
    return this.galleryImages;
  }

  getHistoryImages() {
    return this.historyImages;
  }

  validateImage(file: File): { ok: boolean, error?: string } {
    if (!this.allowedTypes.includes(file.type)) {
      return { ok: false, error: 'Formato no permitido. Use JPG, PNG, GIF o WEBP.' };
    }
    if (file.size > this.maxSize) {
      return { ok: false, error: 'La imagen es demasiado grande. Máximo 1MB.' };
    }
    return { ok: true };
  }

  generatePreview(file: File): Promise<string | ArrayBuffer | null> {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result ?? null);
      reader.readAsDataURL(file);
    });
  }

  clearImage() {
    return {
      file: null,
      preview: null,
      error: '',
      hasError: false
    };
  }


// Método para construir la URL completa de la imagen
   public getFullImageUrlProducts(imagePath: string | null): string {
  if (!imagePath) {
    console.log('🖼️ Imagen nula, usando default');
    return 'assets/images/defaultProduct.jpg';
  }
  
  if (imagePath.startsWith('http')) {
    console.log('🖼️ URL completa:', imagePath);
    return imagePath;
  }
  
  const baseUrl = BASE_PATH_IMAGES_PRODUCTS;
  const fullUrl = `${baseUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  
 
  
  return fullUrl;
}
 

}

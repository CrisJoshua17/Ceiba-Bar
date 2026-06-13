import { config } from './config';

export function getProductImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return 'https://primefaces.org/cdn/primeng/images/galleria/galleria10.jpg';
  }
  if (imagePath.startsWith('http') || imagePath.startsWith('data:image')) {
    return imagePath;
  }
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${config.imageBasePathProducts}${normalizedPath}`;
}

export function getUserImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100';
  }
  if (imagePath.startsWith('http') || imagePath.startsWith('data:image')) {
    return imagePath;
  }
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${config.imageBasePathUsers}${normalizedPath}`;
}

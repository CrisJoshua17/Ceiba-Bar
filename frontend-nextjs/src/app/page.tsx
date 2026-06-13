"use client";

import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { NavbarHome } from '@/components/navbar-home';
import { galleryImages, historyImages, texts } from '@/lib/images-data';
import { getProductImageUrl } from '@/lib/image-utils';
import { ProductsDtoTable } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const addToCart = useCartStore((state) => state.addToCart);

  // TanStack Query for available products
  const { data: products = [], isLoading } = useQuery<ProductsDtoTable[]>({
    queryKey: ['availableProducts'],
    queryFn: async () => {
      const response = await api.get('/api/products');
      if (response.data?.success && response.data?.data) {
        return response.data.data.filter((p: ProductsDtoTable) => p.available);
      }
      return [];
    },
  });

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Product Carousel State
  const carouselRef = useRef<HTMLDivElement>(null);

  const openLightbox = (index: number) => {
    setActivePhotoIndex(index);
    setLightboxOpen(true);
  };

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleAddProduct = (product: ProductsDtoTable) => {
    addToCart(product);
    toast.success(`${product.name} agregado al carrito!`);
  };

  // Carousel controls
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -carouselRef.current.clientWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: carouselRef.current.clientWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarHome />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-b from-ceiba-cream/40 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ceiba-leaf/10 text-ceiba-leaf text-xs font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Experiencia Legendaria
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-ceiba-ink">
                Sabor e Innovación <br />
                <span className="text-ceiba-leaf">En Cada Gota</span>
              </h1>
              <p className="text-base sm:text-lg text-ceiba-ink/80 max-w-2xl leading-relaxed">
                {texts.presentacion}
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#menu-destacados">
                  <Button className="bg-ceiba-ink hover:bg-ceiba-ink/90 text-white font-bold px-8 py-6 rounded-xl transition-all shadow-xs hover:shadow-lg flex items-center gap-2">
                    Ver Carta
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <a href="#nuestra-historia">
                  <Button
                    variant="outline"
                    className="border-ceiba-line text-ceiba-ink hover:bg-ceiba-cream px-8 py-6 rounded-xl transition-all"
                  >
                    Nuestra Historia
                  </Button>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-3xl overflow-hidden border-8 border-ceiba-cream shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=800"
                  alt="Coctel Premium"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-ceiba-line -rotate-3 hidden sm:flex items-center gap-3">
                <div className="p-3 bg-ceiba-leaf/10 rounded-xl text-ceiba-leaf">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Cursos & Talleres</h4>
                  <p className="text-[10px] text-ceiba-ink/60">Aprende de Bartenders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-ceiba-ink">Nuestra Galería</h2>
          <p className="text-sm text-ceiba-ink/75">
            {texts.invitacion}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleryImages.map((photo, index) => (
            <div
              key={index}
              onClick={() => openLightbox(index)}
              className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-ceiba-line shadow-xs hover:shadow-lg transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.itemImageSrc}
                alt={photo.alt}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <span className="text-white text-xs font-bold tracking-wider uppercase bg-ceiba-ink/80 px-4 py-2 rounded-xl border border-white/20">
                  Ampliar
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="menu-destacados" className="py-20 bg-ceiba-cream/30 border-y border-ceiba-line overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 text-left">
              <h2 className="text-3xl font-extrabold text-ceiba-ink">Bebidas Destacadas</h2>
              <p className="text-sm text-ceiba-ink/75">
                Nuestros cócteles y preparados más populares listos para ordenar.
              </p>
            </div>
            {products.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={scrollLeft}
                  size="icon"
                  className="rounded-full bg-white hover:bg-ceiba-cream border border-ceiba-line text-ceiba-ink cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  onClick={scrollRight}
                  size="icon"
                  className="rounded-full bg-white hover:bg-ceiba-cream border border-ceiba-line text-ceiba-ink cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ceiba-leaf"></div>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-sm text-ceiba-ink/60 py-12">
              No hay productos disponibles por el momento.
            </p>
          ) : (
            <div className="relative w-full">
              <div
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory py-4"
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] flex-shrink-0 snap-start"
                  >
                    <Card
                      className="bg-white border border-ceiba-line rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col h-full"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-ceiba-cream">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getProductImageUrl(product.image)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className="absolute top-3 left-3 bg-ceiba-ink/90 text-white font-medium border-none text-[10px]">
                          {product.type === 'DRINK'
                            ? product.drinkType === 'ALCOHOLIC'
                              ? 'Con Alcohol'
                              : 'Sin Alcohol'
                            : product.type === 'SNACK'
                            ? 'Snack'
                            : 'Receta'}
                        </Badge>
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2 text-left">
                          <h3 className="font-bold text-base text-ceiba-ink truncate">
                            {product.name}
                          </h3>
                          <p className="text-xs text-ceiba-ink/70 line-clamp-2 h-8 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-4 mt-auto border-t border-ceiba-line/50">
                          <span className="font-extrabold text-sm text-ceiba-leaf">
                            ${product.price.toFixed(2)} MXN
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleAddProduct(product)}
                            className="bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white rounded-lg px-3 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* History Section */}
      <section id="nuestra-historia" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ceiba-coral/10 text-ceiba-coral text-xs font-bold tracking-wider uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              Nuestra Historia
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ceiba-ink leading-tight">
              3 Amigos, Un Mismo Sueño <br />
              <span className="text-ceiba-coral">Una Leyenda</span>
            </h2>
            <p className="text-sm sm:text-base text-ceiba-ink/85 leading-relaxed">
              {texts.historia}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {historyImages.map((image, index) => (
              <div
                key={index}
                className={`rounded-2xl overflow-hidden border border-ceiba-line shadow-sm relative aspect-[3/4] ${
                  index === 1 ? '-translate-y-4 shadow-md' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.itemImageSrc}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox / Gallery Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xs flex flex-col justify-between p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Header Controls */}
          <div className="flex justify-between items-center text-white py-2 max-w-5xl mx-auto w-full">
            <span className="text-sm font-semibold tracking-widest">
              {activePhotoIndex + 1} / {galleryImages.length}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-white/10 text-white rounded-full cursor-pointer"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Main Visual Display */}
          <div className="flex-1 flex items-center justify-center max-w-5xl mx-auto w-full relative">
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-2 hover:bg-white/10 text-white rounded-full p-2 h-12 w-12 cursor-pointer z-10"
              onClick={prevPhoto}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>

            <div
              className="max-h-[70vh] max-w-[85vw] flex items-center justify-center select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryImages[activePhotoIndex].itemImageSrc}
                alt={galleryImages[activePhotoIndex].alt}
                className="max-h-[70vh] max-w-full rounded-lg object-contain transition-all duration-300 shadow-2xl"
              />
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 hover:bg-white/10 text-white rounded-full p-2 h-12 w-12 cursor-pointer z-10"
              onClick={nextPhoto}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>

          {/* Thumbnails list */}
          <div
            className="flex gap-2 justify-center py-4 overflow-x-auto max-w-4xl mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {galleryImages.map((thumb, index) => (
              <button
                key={index}
                onClick={() => setActivePhotoIndex(index)}
                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  activePhotoIndex === index ? 'border-ceiba-leaf scale-105' : 'border-transparent opacity-60'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb.thumbnailImageSrc}
                  alt={thumb.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-ceiba-ink text-ceiba-paper py-12 mt-auto border-t border-ceiba-line/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div className="space-y-4 text-left">
            <h3 className="font-extrabold text-base tracking-widest">CEIBA BAR</h3>
            <p className="text-xs text-ceiba-paper/70 leading-relaxed">
              Creadores de experiencias legendarias. Cursos, recetarios y delivery de bebidas premium.
            </p>
          </div>
          <div className="space-y-4 text-left">
            <h4 className="font-bold text-xs tracking-wider uppercase">Enlaces</h4>
            <div className="flex flex-col gap-2 text-xs text-ceiba-paper/60">
              <a href="#" className="hover:text-ceiba-leaf">Inicio</a>
              <a href="#menu-destacados" className="hover:text-ceiba-leaf">Carta</a>
              <a href="#nuestra-historia" className="hover:text-ceiba-leaf">Nosotros</a>
            </div>
          </div>
          <div className="space-y-4 text-left">
            <h4 className="font-bold text-xs tracking-wider uppercase">Contacto</h4>
            <p className="text-xs text-ceiba-paper/60 leading-relaxed">
              CDMX, México <br />
              WhatsApp: +52 55 7895 1973 <br />
              Email: info@ceiba-bar.com
            </p>
          </div>
          <div className="space-y-4 text-left">
            <h4 className="font-bold text-xs tracking-wider uppercase">Horarios</h4>
            <p className="text-xs text-ceiba-paper/60 leading-relaxed font-semibold">
              Martes a Domingo: <br />
              14:00 PM - 02:00 AM
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-ceiba-paper/10 text-center text-xs text-ceiba-paper/40">
          © {new Date().getFullYear()} Ceiba Bar. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

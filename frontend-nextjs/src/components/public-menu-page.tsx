"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { NavbarHome } from '@/components/navbar-home';
import { getProductImageUrl } from '@/lib/image-utils';
import { ProductsDtoTable } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ShoppingBag, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface PublicMenuPageProps {
  type: 'DRINK' | 'SNACK' | 'RECETARIO';
  title: string;
  description: string;
}

export function PublicMenuPage({ type, title, description }: PublicMenuPageProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const [searchQuery, setSearchQuery] = useState('');
  const [drinkFilter, setDrinkFilter] = useState<'ALL' | 'ALCOHOLIC' | 'NON_ALCOHOLIC'>('ALL');

  // Fetch products via TanStack Query
  const { data: products = [], isLoading } = useQuery<ProductsDtoTable[]>({
    queryKey: ['availableProducts', type],
    queryFn: async () => {
      const response = await api.get('/api/products');
      if (response.data?.success && response.data?.data) {
        return response.data.data.filter(
          (p: ProductsDtoTable) => p.available && p.type === type
        );
      }
      return [];
    },
  });

  const handleAddProduct = (product: ProductsDtoTable) => {
    addToCart(product);
    toast.success(`${product.name} agregado al carrito!`);
  };

  // Filter products based on search query and drink type
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (type === 'DRINK' && drinkFilter !== 'ALL') {
      const matchesDrinkType = product.drinkType === drinkFilter;
      return matchesSearch && matchesDrinkType;
    }

    return matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarHome />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ceiba-line pb-8">
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ceiba-leaf/10 text-ceiba-leaf text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Categoría
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ceiba-ink">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-ceiba-ink/70 max-w-2xl leading-relaxed">
              {description}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ceiba-ink/40" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              className="pl-10 bg-white border-ceiba-line rounded-xl text-xs py-5 focus-visible:ring-ceiba-leaf"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Sub-Filters for Drinks */}
        {type === 'DRINK' && (
          <div className="flex flex-wrap gap-2 justify-start">
            <Button
              variant={drinkFilter === 'ALL' ? 'default' : 'outline'}
              className={`rounded-xl text-xs px-5 py-2.5 ${
                drinkFilter === 'ALL'
                  ? 'bg-ceiba-ink text-white'
                  : 'border-ceiba-line text-ceiba-ink hover:bg-ceiba-cream'
              }`}
              onClick={() => setDrinkFilter('ALL')}
            >
              Todos
            </Button>
            <Button
              variant={drinkFilter === 'ALCOHOLIC' ? 'default' : 'outline'}
              className={`rounded-xl text-xs px-5 py-2.5 ${
                drinkFilter === 'ALCOHOLIC'
                  ? 'bg-ceiba-ink text-white'
                  : 'border-ceiba-line text-ceiba-ink hover:bg-ceiba-cream'
              }`}
              onClick={() => setDrinkFilter('ALCOHOLIC')}
            >
              Con Alcohol (Alcoholic)
            </Button>
            <Button
              variant={drinkFilter === 'NON_ALCOHOLIC' ? 'default' : 'outline'}
              className={`rounded-xl text-xs px-5 py-2.5 ${
                drinkFilter === 'NON_ALCOHOLIC'
                  ? 'bg-ceiba-ink text-white'
                  : 'border-ceiba-line text-ceiba-ink hover:bg-ceiba-cream'
              }`}
              onClick={() => setDrinkFilter('NON_ALCOHOLIC')}
            >
              Sin Alcohol (Non Alcoholic)
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ceiba-leaf"></div>
            <p className="text-xs text-ceiba-ink/65">Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-ceiba-line rounded-2xl bg-white/50">
            <div className="w-12 h-12 rounded-full bg-ceiba-cream flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-ceiba-ink/40" />
            </div>
            <div>
              <p className="text-base font-semibold text-ceiba-ink">No se encontraron productos</p>
              <p className="text-xs text-ceiba-ink/60 mt-1">
                Intenta buscando con palabras clave diferentes o cambia de categoría.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="bg-white border border-ceiba-line rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col h-full"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-ceiba-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProductImageUrl(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {type === 'DRINK' && (
                    <Badge className="absolute top-3 left-3 bg-ceiba-ink/90 text-white font-medium border-none text-[10px]">
                      {product.drinkType === 'ALCOHOLIC' ? 'Con Alcohol' : 'Sin Alcohol'}
                    </Badge>
                  )}
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
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-ceiba-ink text-ceiba-paper py-10 mt-auto border-t border-ceiba-line/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-ceiba-paper/50">
          © {new Date().getFullYear()} Ceiba Bar. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

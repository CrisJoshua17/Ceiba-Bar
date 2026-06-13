"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { NavbarCustomer } from '@/components/navbar-customer';
import { getProductImageUrl } from '@/lib/image-utils';
import { ProductsDtoTable } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ShoppingBag, Plus, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function CustomerMenuPage() {
  const addToCart = useCartStore((state) => state.addToCart);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [drinkFilter, setDrinkFilter] = useState<'ALL' | 'ALCOHOLIC' | 'NON_ALCOHOLIC'>('ALL');

  // Fetch products via TanStack Query
  const { data: products = [], isLoading } = useQuery<ProductsDtoTable[]>({
    queryKey: ['availableProductsCustomer'],
    queryFn: async () => {
      const response = await api.get('/api/products');
      if (response.data?.success && response.data?.data) {
        return response.data.data.filter((p: ProductsDtoTable) => p.available);
      }
      return [];
    },
  });

  const handleAddProduct = (product: ProductsDtoTable) => {
    addToCart(product);
    toast.success(`${product.name} agregado al carrito!`);
  };

  // Filter products based on activeTab, search query, and drink filter
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'drinks' && product.type === 'DRINK') ||
      (activeTab === 'snacks' && product.type === 'SNACK') ||
      (activeTab === 'recipes' && product.type === 'RECETARIO');

    if (activeTab === 'drinks' && drinkFilter !== 'ALL' && product.type === 'DRINK') {
      const matchesDrinkType = product.drinkType === drinkFilter;
      return matchesSearch && matchesTab && matchesDrinkType;
    }

    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarCustomer />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ceiba-line pb-6">
          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-ceiba-ink flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-ceiba-leaf" />
              Menú Digital
            </h1>
            <p className="text-xs text-ceiba-ink/60 max-w-xl">
              Selecciona tus bebidas, botanas y recetas favoritas y agrégalas al carrito para recibirlas en tu dirección.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ceiba-ink/40" />
            <Input
              type="text"
              placeholder="Buscar cóctel o botana..."
              className="pl-10 bg-white border-ceiba-line rounded-xl text-xs py-5 focus-visible:ring-ceiba-leaf"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 bg-ceiba-cream p-1 rounded-2xl max-w-md border border-ceiba-line">
            <TabsTrigger value="all" className="rounded-xl py-2.5 text-xs font-bold transition-all data-[state=active]:bg-ceiba-ink data-[state=active]:text-white">
              Todos
            </TabsTrigger>
            <TabsTrigger value="drinks" className="rounded-xl py-2.5 text-xs font-bold transition-all data-[state=active]:bg-ceiba-ink data-[state=active]:text-white">
              Drinks
            </TabsTrigger>
            <TabsTrigger value="snacks" className="rounded-xl py-2.5 text-xs font-bold transition-all data-[state=active]:bg-ceiba-ink data-[state=active]:text-white">
              Snacks
            </TabsTrigger>
            <TabsTrigger value="recipes" className="rounded-xl py-2.5 text-xs font-bold transition-all data-[state=active]:bg-ceiba-ink data-[state=active]:text-white">
              Recetas
            </TabsTrigger>
          </TabsList>

          {/* Subfilters for Drinks */}
          {activeTab === 'drinks' && (
            <div className="flex flex-wrap gap-2 justify-start mt-6 animate-in fade-in duration-200">
              <Button
                variant={drinkFilter === 'ALL' ? 'default' : 'outline'}
                className={`rounded-xl text-[10px] sm:text-xs px-4 py-2 ${
                  drinkFilter === 'ALL'
                    ? 'bg-ceiba-ink text-white'
                    : 'border-ceiba-line text-ceiba-ink hover:bg-ceiba-cream bg-white'
                }`}
                onClick={() => setDrinkFilter('ALL')}
              >
                Todos
              </Button>
              <Button
                variant={drinkFilter === 'ALCOHOLIC' ? 'default' : 'outline'}
                className={`rounded-xl text-[10px] sm:text-xs px-4 py-2 ${
                  drinkFilter === 'ALCOHOLIC'
                    ? 'bg-ceiba-ink text-white'
                    : 'border-ceiba-line text-ceiba-ink hover:bg-ceiba-cream bg-white'
                }`}
                onClick={() => setDrinkFilter('ALCOHOLIC')}
              >
                Con Alcohol
              </Button>
              <Button
                variant={drinkFilter === 'NON_ALCOHOLIC' ? 'default' : 'outline'}
                className={`rounded-xl text-[10px] sm:text-xs px-4 py-2 ${
                  drinkFilter === 'NON_ALCOHOLIC'
                    ? 'bg-ceiba-ink text-white'
                    : 'border-ceiba-line text-ceiba-ink hover:bg-ceiba-cream bg-white'
                }`}
                onClick={() => setDrinkFilter('NON_ALCOHOLIC')}
              >
                Sin Alcohol
              </Button>
            </div>
          )}

          {/* Tab contents (reusing filtered products list) */}
          <div className="mt-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ceiba-leaf"></div>
                <p className="text-xs text-ceiba-ink/65">Cargando menú...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-ceiba-line rounded-3xl bg-white/50">
                <div className="w-12 h-12 rounded-full bg-ceiba-cream flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-ceiba-ink/40" />
                </div>
                <div>
                  <p className="text-base font-semibold text-ceiba-ink">No hay productos que coincidan</p>
                  <p className="text-xs text-ceiba-ink/60 mt-1">
                    Prueba modificando los filtros o tu búsqueda.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="bg-white border border-ceiba-line rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col h-full animate-in zoom-in-95 duration-200"
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
                            ? 'Bebida Alcohólica'
                            : 'Bebida Sin Alcohol'
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
                ))}
              </div>
            )}
          </div>
        </Tabs>
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

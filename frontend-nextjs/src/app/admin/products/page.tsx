"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/axios';
import { NavbarAdmin } from '@/components/navbar-admin';
import { ProductsDtoTable } from '@/types';
import { getProductImageUrl } from '@/lib/image-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, Plus, Edit2, Trash2, ArrowLeft, ShoppingBag, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminProductsPage() {
  const router = useRouter();
  const { authenticated, initialized } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductsDtoTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [available, setAvailable] = useState(true);
  const [type, setType] = useState<'DRINK' | 'SNACK' | 'RECETARIO'>('DRINK');
  const [drinkType, setDrinkType] = useState<'ALCOHOLIC' | 'NON_ALCOHOLIC'>('ALCOHOLIC');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !authenticated) {
      router.push('/login');
    }
  }, [initialized, authenticated, router]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/products/all');
      if (response.data?.success) {
        setProducts(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      toast.error('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadProducts();
    }
  }, [authenticated]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setAvailable(true);
    setType('DRINK');
    setDrinkType('ALCOHOLIC');
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (product: ProductsDtoTable) => {
    setEditingId(product.id);
    setName(product.name || '');
    setDescription(product.description || '');
    setPrice(product.price?.toString() || '');
    setAvailable(product.available);
    setType(product.type || 'DRINK');
    setDrinkType((product.drinkType as any) || 'ALCOHOLIC');
    setImageFile(null);
    setImagePreview(product.image ? getProductImageUrl(product.image) : null);
    setDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('La imagen es demasiado grande. Máximo 1MB.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !price) {
      toast.error('Por favor, rellena todos los campos.');
      return;
    }

    setSavingProduct(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('available', available.toString());
    formData.append('type', type);
    if (type === 'DRINK') {
      formData.append('drinkType', drinkType);
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      let success = false;
      let msg = '';
      if (editingId) {
        const response = await api.put(`/api/products/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        success = response.data?.success;
        msg = response.data?.message || 'Producto actualizado exitosamente.';
      } else {
        const response = await api.post('/api/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        success = response.data?.success;
        msg = response.data?.message || 'Producto creado exitosamente.';
      }

      if (success) {
        toast.success(msg);
        setDialogOpen(false);
        loadProducts();
      } else {
        toast.error(msg);
      }
    } catch (err) {
      console.error('Error saving product:', err);
      toast.error('Error al conectar con el microservicio de productos.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setDeletingId(id);
      try {
        const response = await api.delete(`/api/products/${id}`);
        if (response.data?.success) {
          toast.success('Producto eliminado correctamente.');
          loadProducts();
        } else {
          toast.error(response.data?.message || 'Error al eliminar producto.');
        }
      } catch (err) {
        console.error('Error deleting product:', err);
        toast.error('Error de red al eliminar el producto.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return true;
    return (
      p.name?.toLowerCase().includes(s) ||
      p.description?.toLowerCase().includes(s) ||
      p.type?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      <NavbarAdmin />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ceiba-line pb-6">
          <div className="space-y-2 text-left">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ceiba-leaf hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Panel
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-ceiba-ink flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-ceiba-leaf" />
              Gestión de Productos
            </h1>
            <p className="text-xs text-ceiba-ink/65 max-w-xl">
              Crea nuevos cócteles, snacks o recetarios, edita los precios y gestiona la disponibilidad en tiempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
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
            <Button
              onClick={handleOpenCreate}
              className="w-full sm:w-auto bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white font-bold py-5 px-5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-ceiba-leaf animate-spin" />
            <p className="text-xs text-ceiba-ink/65">Obteniendo catálogo de productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-ceiba-line rounded-3xl bg-white/50">
            <div className="w-12 h-12 rounded-full bg-ceiba-cream flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-ceiba-ink/40" />
            </div>
            <div>
              <p className="text-base font-semibold text-ceiba-ink">No se encontraron productos</p>
              <p className="text-xs text-ceiba-ink/60 mt-1">
                Comienza agregando un producto usando el botón superior.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-ceiba-line rounded-3xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-ceiba-line bg-ceiba-cream/15">
                  <TableHead className="text-xs font-bold text-ceiba-ink w-[80px]">Imagen</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Nombre</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Categoría</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Precio</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Disponibilidad</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-ceiba-cream/10 border-ceiba-line/50">
                    <TableCell className="py-2.5">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-ceiba-line bg-ceiba-cream flex-shrink-0 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getProductImageUrl(product.image)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-extrabold text-ceiba-ink py-4">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-xs text-ceiba-ink/80 py-4 font-semibold uppercase">
                      {product.type === 'DRINK'
                        ? product.drinkType === 'ALCOHOLIC'
                          ? 'DRINK - ALCOHOLIC'
                          : 'DRINK - NON ALCOHOLIC'
                        : product.type}
                    </TableCell>
                    <TableCell className="text-xs text-ceiba-leaf py-4 font-extrabold">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs py-4">
                      {product.available ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-semibold">
                          Disponible
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-semibold">
                          No Disponible
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-4 space-x-1.5 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg px-2 text-ceiba-ink hover:bg-ceiba-cream"
                        onClick={() => handleOpenEdit(product)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={deletingId !== null}
                        className="h-8 rounded-lg px-2 text-ceiba-coral hover:bg-red-50"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-ceiba-line rounded-3xl sm:max-w-md text-ceiba-ink p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-ceiba-line pb-3">
            <DialogTitle className="text-lg font-bold text-ceiba-ink">
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 py-4 text-left">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="pName" className="text-xs font-bold">Nombre del Producto</Label>
              <Input
                id="pName"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Mojito Cubano"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="pDesc" className="text-xs font-bold">Descripción</Label>
              <Input
                id="pDesc"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ingredientes, notas de sabor..."
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label htmlFor="pPrice" className="text-xs font-bold">Precio (MXN)</Label>
              <Input
                id="pPrice"
                type="number"
                step="0.01"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="120.00"
              />
            </div>

            {/* Category Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Categoría</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger className="border-ceiba-line rounded-xl focus:ring-ceiba-leaf">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent className="bg-white border-ceiba-line">
                  <SelectItem value="DRINK">Bebida (DRINK)</SelectItem>
                  <SelectItem value="SNACK">Aperitivo (SNACK)</SelectItem>
                  <SelectItem value="RECETARIO">Receta (RECETARIO)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Drink Sub-Type */}
            {type === 'DRINK' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tipo de Bebida</Label>
                <Select value={drinkType} onValueChange={(val: any) => setDrinkType(val)}>
                  <SelectTrigger className="border-ceiba-line rounded-xl focus:ring-ceiba-leaf">
                    <SelectValue placeholder="Selecciona tipo de bebida" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-ceiba-line">
                    <SelectItem value="ALCOHOLIC">Con Alcohol (ALCOHOLIC)</SelectItem>
                    <SelectItem value="NON_ALCOHOLIC">Sin Alcohol (NON_ALCOHOLIC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Image Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Imagen del Producto</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="productPhoto"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-ceiba-line bg-ceiba-cream/50 hover:bg-ceiba-cream text-xs font-bold text-ceiba-ink cursor-pointer transition-all hover:border-ceiba-leaf"
                >
                  <Upload className="w-4 h-4 text-ceiba-leaf" />
                  Subir Foto
                </label>
                <input
                  id="productPhoto"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {imageFile && (
                  <span className="text-[10px] text-ceiba-ink/60 font-semibold truncate max-w-[200px]">
                    {imageFile.name}
                  </span>
                )}
              </div>
              {imagePreview && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-ceiba-line bg-white mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Available Checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="pAvail"
                checked={available}
                onCheckedChange={(checked) => setAvailable(!!checked)}
                className="border-ceiba-line focus-visible:ring-ceiba-leaf"
              />
              <Label htmlFor="pAvail" className="text-xs font-semibold cursor-pointer">
                ¿Producto disponible e in stock?
              </Label>
            </div>

            <DialogFooter className="border-t border-ceiba-line pt-3 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-ceiba-line text-ceiba-ink rounded-xl"
                onClick={() => setDialogOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                type="submit"
                disabled={savingProduct}
                className="bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white font-bold rounded-xl"
              >
                {savingProduct ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

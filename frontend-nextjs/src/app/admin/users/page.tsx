"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/axios';
import { NavbarAdmin } from '@/components/navbar-admin';
import { UsersDtoTable } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, Trash2, ArrowLeft, Users, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminUsersPage() {
  const router = useRouter();
  const { authenticated, initialized } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UsersDtoTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialized && !authenticated) {
      router.push('/login');
    }
  }, [initialized, authenticated, router]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users');
      if (response.data?.success) {
        setUsers(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadUsers();
    }
  }, [authenticated]);

  const handleDeleteUser = async (user: UsersDtoTable) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${user.name} ${user.lastName}?`)) {
      setDeletingId(user.id);
      try {
        const response = await api.delete(`/api/users/${user.id}`);
        if (response.data?.success) {
          toast.success('Usuario eliminado correctamente.');
          loadUsers();
        } else {
          toast.error(response.data?.message || 'Error al eliminar usuario.');
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        toast.error('Error al conectar con el microservicio de usuarios.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold text-[10px]">ADMINISTRADOR</Badge>;
      case 'DRIVER':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[10px]">REPARTIDOR</Badge>;
      default:
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[10px]">CLIENTE</Badge>;
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const s = searchQuery.toLowerCase().trim();
    if (!s) return true;
    return (
      u.name?.toLowerCase().includes(s) ||
      u.lastName?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.phone?.includes(s)
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
              <Users className="w-8 h-8 text-ceiba-leaf" />
              Gestión de Usuarios
            </h1>
            <p className="text-xs text-ceiba-ink/65 max-w-xl">
              Administra todas las cuentas de la plataforma, incluyendo clientes, repartidores y otros administradores.
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ceiba-ink/40" />
            <Input
              type="text"
              placeholder="Buscar por nombre, email..."
              className="pl-10 bg-white border-ceiba-line rounded-xl text-xs py-5 focus-visible:ring-ceiba-leaf"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-ceiba-leaf animate-spin" />
            <p className="text-xs text-ceiba-ink/65">Obteniendo listado de usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border border-dashed border-ceiba-line rounded-3xl bg-white/50">
            <div className="w-12 h-12 rounded-full bg-ceiba-cream flex items-center justify-center">
              <Users className="w-6 h-6 text-ceiba-ink/40" />
            </div>
            <div>
              <p className="text-base font-semibold text-ceiba-ink">No se encontraron usuarios</p>
              <p className="text-xs text-ceiba-ink/60 mt-1">
                Prueba buscando con palabras clave diferentes.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-ceiba-line rounded-3xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-ceiba-line bg-ceiba-cream/15">
                  <TableHead className="text-xs font-bold text-ceiba-ink">Nombre Completo</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Email</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Teléfono</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink">Rol</TableHead>
                  <TableHead className="text-xs font-bold text-ceiba-ink text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-ceiba-cream/10 border-ceiba-line/50">
                    <TableCell className="text-xs font-extrabold text-ceiba-ink py-4">
                      {user.name} {user.lastName}
                    </TableCell>
                    <TableCell className="text-xs text-ceiba-ink/80 py-4 font-semibold">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-xs text-ceiba-ink/65 py-4 font-semibold">
                      {user.phone || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs py-4">{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-right py-4 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={deletingId !== null}
                        className="h-8 rounded-lg px-3 text-ceiba-coral hover:bg-red-50 hover:text-red-600 flex items-center gap-1 font-bold text-xs cursor-pointer"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

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
import { Search, Loader2, Trash2, ArrowLeft, Users, ShieldAlert, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminUsersPage() {
  const router = useRouter();
  const { authenticated, user, initialized } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UsersDtoTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // User creation states
  const [createOpen, setCreateOpen] = useState(false);
  const [createRole, setCreateRole] = useState<'ADMIN' | 'DRIVER' | 'CUSTOMER'>('CUSTOMER');
  const [newName, setNewName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newLastName || !newEmail || !newPassword) {
      toast.error('Por favor, completa todos los campos obligatorios.');
      return;
    }

    setCreating(true);
    try {
      let endpoint = '';
      if (createRole === 'ADMIN') endpoint = '/api/users/admins';
      else if (createRole === 'DRIVER') endpoint = '/api/users/drivers';
      else endpoint = '/api/users/register';

      const payload = {
        name: newName,
        lastName: newLastName,
        email: newEmail,
        phone: parseInt(newPhone, 10) || null,
        password: newPassword,
      };

      const response = await api.post(endpoint, payload);
      if (response.data?.success) {
        toast.success('Usuario creado correctamente!');
        setCreateOpen(false);
        // Reset form
        setNewName('');
        setNewLastName('');
        setNewEmail('');
        setNewPhone('');
        setNewPassword('');
        loadUsers();
      } else {
        toast.error(response.data?.message || 'Error al crear usuario.');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast.error(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (initialized) {
      if (!authenticated) {
        router.push('/login');
      } else if (user?.primaryRole !== 'ADMIN') {
        if (user?.primaryRole === 'DRIVER') {
          router.push('/drivers/dashboard');
        } else {
          router.push('/customer/dashboard');
        }
      }
    }
  }, [initialized, authenticated, user, router]);

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
      (u.name || '').toLowerCase().includes(s) ||
      (u.lastName || '').toLowerCase().includes(s) ||
      (u.email || '').toLowerCase().includes(s) ||
      String(u.phone || '').includes(s)
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

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:max-w-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ceiba-ink/40" />
              <Input
                type="text"
                placeholder="Buscar por nombre, email..."
                className="pl-10 bg-white border-ceiba-line rounded-xl text-xs py-5 focus-visible:ring-ceiba-leaf"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className="bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white rounded-xl py-5 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Crear Usuario
            </Button>
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

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-white border-ceiba-line rounded-3xl sm:max-w-md text-ceiba-ink p-6">
          <DialogHeader className="border-b border-ceiba-line pb-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              Crear Nuevo Usuario
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-4 text-left">
            {/* Select Role */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Rol de Usuario</Label>
              <Select value={createRole} onValueChange={(val: any) => setCreateRole(val || 'CUSTOMER')}>
                <SelectTrigger className="border-ceiba-line rounded-xl focus:ring-ceiba-leaf">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent className="bg-white border-ceiba-line">
                  <SelectItem value="CUSTOMER">Cliente</SelectItem>
                  <SelectItem value="DRIVER">Repartidor</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold">Nombre *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nombre"
                required
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf py-5 text-xs"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-bold">Apellido *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Apellido"
                required
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf py-5 text-xs"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@ejemplo.com"
                required
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf py-5 text-xs"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold">Teléfono (Opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Solo números"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf py-5 text-xs"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf py-5 text-xs"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <DialogFooter className="border-t border-ceiba-line pt-3 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-ceiba-line text-ceiba-ink rounded-xl"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white font-bold rounded-xl"
              >
                {creating ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-ceiba-ink text-ceiba-paper py-10 mt-auto border-t border-ceiba-line/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-ceiba-paper/50">
          © {new Date().getFullYear()} Ceiba Bar. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

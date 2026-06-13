"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { NavbarAdmin } from '@/components/navbar-admin';
import { NavbarCustomer } from '@/components/navbar-customer';
import { NavbarDriver } from '@/components/navbar-driver';
import { NavbarHome } from '@/components/navbar-home';
import { getUserImageUrl } from '@/lib/image-utils';
import { CreateAddressDto } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Trash,
  MapPin,
  Settings,
  Plus,
  Star,
  Upload,
  User,
  Phone,
  Mail,
  Home,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MyProfilePage() {
  const router = useRouter();
  const {
    initialized,
    authenticated,
    user,
    profile,
    fetchProfile,
    updateProfile,
    deleteProfile,
    addAddress,
  } = useAuthStore();

  // Redirect if not logged in
  useEffect(() => {
    if (initialized && !authenticated) {
      router.push('/login');
    }
  }, [initialized, authenticated, router]);

  // Load profile on mount
  useEffect(() => {
    if (authenticated) {
      fetchProfile();
    }
  }, [authenticated, fetchProfile]);

  // User form state
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Address dialog state
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [alias, setAlias] = useState('');
  const [street, setStreet] = useState('');
  const [colonia, setColonia] = useState('');
  const [city] = useState('Ciudad de México');
  const [state, setState] = useState('');
  const [delegacion, setDelegacion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Populate form when profile is loaded
  useEffect(() => {
    if (profile?.user) {
      setName(profile.user.name || '');
      setLastName(profile.user.lastName || '');
      setEmail(profile.user.email || '');
      setPhone(profile.user.phone || '');
    }
  }, [profile]);

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('phone', phone);
    if (imageFile) {
      formData.append('photo', imageFile);
    }

    const success = await updateProfile(formData);
    setUpdating(false);
    if (success) {
      toast.success('Perfil actualizado correctamente!');
      setImageFile(null);
    } else {
      toast.error('Error al actualizar el perfil.');
    }
  };

  const handleDeleteProfile = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar tu perfil permanentemente? Esta acción no se puede deshacer.')) {
      const success = await deleteProfile();
      if (success) {
        toast.success('Perfil eliminado correctamente');
        router.push('/');
      } else {
        toast.error('Error al eliminar el perfil.');
      }
    }
  };

  const handleAddAddressSubmit = async () => {
    if (!alias || !street || !colonia || !state || !delegacion || !postalCode) {
      toast.error('Por favor, rellena todos los campos obligatorios de la dirección.');
      return;
    }

    setSavingAddress(true);
    const newAddress: CreateAddressDto = {
      alias,
      street,
      colonia,
      city,
      state,
      delegacion,
      postalCode,
      isDefault,
    };

    const success = await addAddress(newAddress);
    setSavingAddress(false);
    if (success) {
      toast.success('Dirección agregada correctamente!');
      setAddressDialogOpen(false);
      // Clean form fields
      setAlias('');
      setStreet('');
      setColonia('');
      setState('');
      setDelegacion('');
      setPostalCode('');
      setIsDefault(false);
    } else {
      toast.error('Error al guardar la dirección.');
    }
  };

  // Select navbar according to role
  const renderNavbar = () => {
    if (!profile?.user?.role) return <NavbarHome />;
    switch (profile.user.role) {
      case 'ADMIN':
        return <NavbarAdmin />;
      case 'DRIVER':
        return <NavbarDriver />;
      case 'CUSTOMER':
        return <NavbarCustomer />;
      default:
        return <NavbarHome />;
    }
  };

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
        {renderNavbar()}
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ceiba-leaf"></div>
          <p className="text-xs text-ceiba-ink/65">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-ceiba-paper text-ceiba-ink">
      {renderNavbar()}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-left space-y-2 border-b border-ceiba-line pb-6">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Settings className="w-8 h-8 text-ceiba-leaf animate-spin-slow" />
            Editar Perfil
          </h1>
          <p className="text-xs text-ceiba-ink/60">
            Administra tu información personal, direcciones de entrega y preferencias.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Photo & Actions) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-white border-ceiba-line rounded-3xl overflow-hidden shadow-md">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-ceiba-cream shadow-inner group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview || getUserImageUrl(profile.user.image)}
                    alt="Perfil"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-bold text-base text-ceiba-ink">
                    {profile.user.name} {profile.user.lastName}
                  </h3>
                  <span className="text-[10px] bg-ceiba-leaf/10 text-ceiba-leaf px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    {profile.user.role}
                  </span>
                </div>

                {profile.user.role === 'DRIVER' && (
                  <div className="flex items-center gap-2 bg-ceiba-cream px-4 py-2 rounded-xl border border-ceiba-line">
                    <span className="text-xs font-bold">Calificación:</span>
                    <span className="text-sm font-extrabold text-ceiba-ink flex items-center gap-1">
                      {profile.driver?.rating || 5.0}
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete Profile card */}
            <Card className="bg-red-50/50 border border-red-200/60 rounded-3xl overflow-hidden">
              <CardContent className="p-6 text-left space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-red-900">Eliminar cuenta</h3>
                  <p className="text-xs text-red-800/80 mt-1 leading-relaxed">
                    Tu información se eliminará permanentemente del sistema. No se puede deshacer.
                  </p>
                </div>
                <Button
                  onClick={handleDeleteProfile}
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-5 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-lg transition-all"
                >
                  <Trash className="w-4 h-4" />
                  Eliminar Cuenta
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Form & Addresses) */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="bg-white border-ceiba-line rounded-3xl shadow-md">
              <CardContent className="p-8">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2 text-left">
                      <Label htmlFor="firstName" className="text-xs font-bold text-ceiba-ink/85 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-ceiba-leaf" /> Nombre
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        required
                        className="bg-ceiba-paper/50 border-ceiba-line rounded-xl py-5 focus-visible:ring-ceiba-leaf"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2 text-left">
                      <Label htmlFor="lastName" className="text-xs font-bold text-ceiba-ink/85 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-ceiba-leaf" /> Apellido
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        required
                        className="bg-ceiba-paper/50 border-ceiba-line rounded-xl py-5 focus-visible:ring-ceiba-leaf"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2 text-left">
                      <Label htmlFor="email" className="text-xs font-bold text-ceiba-ink/85 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-ceiba-leaf" /> Correo Electrónico
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        disabled
                        className="bg-ceiba-cream/45 border-ceiba-line rounded-xl py-5 cursor-not-allowed text-ceiba-ink/60"
                        value={email}
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2 text-left">
                      <Label htmlFor="phone" className="text-xs font-bold text-ceiba-ink/85 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-ceiba-leaf" /> Teléfono
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        maxLength={10}
                        className="bg-ceiba-paper/50 border-ceiba-line rounded-xl py-5 focus-visible:ring-ceiba-leaf"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10 dígitos"
                      />
                    </div>
                  </div>

                  {/* Profile Image selector */}
                  <div className="space-y-2 text-left">
                    <Label htmlFor="profilePhoto" className="text-xs font-bold text-ceiba-ink/85">
                      Cambiar foto de perfil
                    </Label>
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="profilePhoto"
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-ceiba-line bg-ceiba-cream/50 hover:bg-ceiba-cream text-xs font-bold text-ceiba-ink cursor-pointer transition-all hover:border-ceiba-leaf"
                      >
                        <Upload className="w-4 h-4 text-ceiba-leaf" />
                        Seleccionar Imagen
                      </label>
                      <input
                        id="profilePhoto"
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
                  </div>

                  {/* Customer specific Addresses block */}
                  {profile.user.role === 'CUSTOMER' && (
                    <div className="border-t border-ceiba-line pt-6 text-left space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-ceiba-ink flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-ceiba-leaf" />
                          Direcciones de Entrega
                        </h3>
                        <Button
                          type="button"
                          onClick={() => setAddressDialogOpen(true)}
                          className="bg-ceiba-cream hover:bg-ceiba-line text-ceiba-ink text-xs font-bold rounded-lg flex items-center gap-1.5 px-3 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-ceiba-leaf" />
                          Agregar
                        </Button>
                      </div>

                      {profile.customer?.addresses?.length === 0 ? (
                        <p className="text-xs text-ceiba-ink/50 bg-ceiba-cream/30 p-4 rounded-xl text-center border border-dashed border-ceiba-line">
                          No tienes direcciones guardadas. Agrega una para realizar pedidos.
                        </p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {profile.customer?.addresses?.map((addr) => (
                            <div
                              key={addr.id}
                              className={`p-4 rounded-2xl border text-xs space-y-1.5 text-left transition-all ${
                                addr.isDefault
                                  ? 'border-ceiba-leaf bg-ceiba-leaf/5'
                                  : 'border-ceiba-line bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-ceiba-ink">{addr.alias}</span>
                                {addr.isDefault && (
                                  <span className="text-[8px] bg-ceiba-leaf text-white font-bold px-2 py-0.5 rounded-full uppercase">
                                    Principal
                                  </span>
                                )}
                              </div>
                              <p className="text-ceiba-ink/80 leading-relaxed font-semibold">
                                {addr.street}, {addr.colonia}
                              </p>
                              <p className="text-ceiba-ink/60">
                                {addr.delegacion}, {addr.state}, CP {addr.postalCode}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Submit buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-ceiba-line">
                    <Button
                      type="submit"
                      disabled={updating}
                      className="bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white font-bold px-6 py-5 rounded-xl transition-all shadow-xs hover:shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      {updating ? 'Guardando...' : 'Actualizar Perfil'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="bg-white border-ceiba-line rounded-3xl sm:max-w-md text-ceiba-ink p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-ceiba-line pb-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-ceiba-ink">
              <MapPin className="w-5 h-5 text-ceiba-leaf" />
              Agregar Dirección
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-left">
            {/* Alias */}
            <div className="space-y-1.5">
              <Label htmlFor="alias" className="text-xs font-bold">Alias (Ej. Casa, Oficina)</Label>
              <Input
                id="alias"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Casa"
              />
            </div>

            {/* Street */}
            <div className="space-y-1.5">
              <Label htmlFor="street" className="text-xs font-bold">Calle con Número</Label>
              <Input
                id="street"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Av. Reforma #123"
              />
            </div>

            {/* Colonia */}
            <div className="space-y-1.5">
              <Label htmlFor="colonia" className="text-xs font-bold">Colonia</Label>
              <Input
                id="colonia"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                value={colonia}
                onChange={(e) => setColonia(e.target.value)}
                placeholder="Roma Norte"
              />
            </div>

            {/* Delegacion */}
            <div className="space-y-1.5">
              <Label htmlFor="delegacion" className="text-xs font-bold">Delegación / Municipio</Label>
              <Input
                id="delegacion"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                value={delegacion}
                onChange={(e) => setDelegacion(e.target.value)}
                placeholder="Cuauhtémoc"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-xs font-bold">Estado</Label>
              <Input
                id="state"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="CDMX"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-1.5">
              <Label htmlFor="postalCode" className="text-xs font-bold">Código Postal</Label>
              <Input
                id="postalCode"
                className="border-ceiba-line rounded-xl focus-visible:ring-ceiba-leaf"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="06700"
              />
            </div>

            {/* City (Static info) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-ceiba-ink/60">Ciudad</Label>
              <Input
                disabled
                className="bg-ceiba-cream/45 border-ceiba-line rounded-xl cursor-not-allowed text-ceiba-ink/60"
                value={city}
              />
            </div>

            {/* Default Address Checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(!!checked)}
                className="border-ceiba-line focus-visible:ring-ceiba-leaf"
              />
              <Label htmlFor="isDefault" className="text-xs font-semibold cursor-pointer">
                ¿Definir como dirección predeterminada?
              </Label>
            </div>
          </div>

          <DialogFooter className="border-t border-ceiba-line pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-ceiba-line text-ceiba-ink rounded-xl"
              onClick={() => setAddressDialogOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              disabled={savingAddress}
              className="bg-ceiba-leaf hover:bg-ceiba-leaf-dark text-white font-bold rounded-xl"
              onClick={handleAddAddressSubmit}
            >
              {savingAddress ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

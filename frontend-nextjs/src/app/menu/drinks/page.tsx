"use client";

import React from 'react';
import { PublicMenuPage } from '@/components/public-menu-page';

export default function DrinksMenuPage() {
  return (
    <PublicMenuPage
      type="DRINK"
      title="Drinks - Bebidas & Cócteles"
      description="Explora nuestra exclusiva carta de bebidas preparadas con ingredientes de Veracruz y Chiapas. Desde cócteles clásicos hasta innovaciones sin alcohol."
    />
  );
}

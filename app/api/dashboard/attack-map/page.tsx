import { useState, useEffect } from 'react';// This is a placeholder for the API attack-map page
// It redirects to the actual attack-map page

import { redirect } from 'next/navigation';

export default function AttackMapApiPage() {
  // Redirect to the actual attack-map page
  redirect('/dashboard/attack-map');
}
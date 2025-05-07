import { useState, useEffect } from 'react';
// This is a layout file for API routes under /api/dashboard.
// In Next.js App Router, API routes don't typically have layouts.
// This file exists to ensure proper structure but doesn't provide visual layout.

import { NextResponse } from 'next/server';

export default function DashboardApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This is a placeholder layout for API routes
  // It doesn't actually render any UI
  return children;
}

// Handle requests to this layout directly
export async function GET() {
  return NextResponse.json({
    error: 'This is an API directory, not a page',
    message: 'Please use specific API endpoints under this path',
  }, { status: 404 });
}
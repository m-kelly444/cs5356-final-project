import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';// This is a placeholder for the API vulnerabilities page
// It redirects to the actual vulnerabilities page

import { redirect } from 'next/navigation';

export default function VulnerabilitiesApiPage() {
  // Redirect to the actual vulnerabilities page
  redirect('/dashboard/vulnerabilities');
}
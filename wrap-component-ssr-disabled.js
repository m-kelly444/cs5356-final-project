// Usage: node wrap-component-ssr-disabled.js ComponentName
// This creates a wrapper that disables SSR for the component

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.log("Usage: node wrap-component-ssr-disabled.js ComponentName");
  process.exit(1);
}

const componentName = process.argv[2];
const wrapperFileName = `${componentName}Wrapper.jsx`;

const wrapperContent = `"use client";

import dynamic from 'next/dynamic';

// Disable SSR for this component
const ${componentName}NoSSR = dynamic(
  () => import('./${componentName}'),
  { ssr: false }
);

export default function ${componentName}Wrapper(props) {
  return <${componentName}NoSSR {...props} />;
}
`;

fs.writeFileSync(wrapperFileName, wrapperContent);
console.log(`Created ${wrapperFileName} - use this component instead of ${componentName} to avoid hydration errors`);

// Usage: node fix-layout-hydration.js [file.js]
// This adds suppressHydrationWarning to root elements

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.log("Usage: node fix-layout-hydration.js [layout-file.js]");
  process.exit(1);
}

const fileName = process.argv[2];
const fileContent = fs.readFileSync(fileName, 'utf8');

// Add suppressHydrationWarning to html and body tags
let updatedContent = fileContent
  .replace(/<html([^>]*)>/g, '<html$1 suppressHydrationWarning>')
  .replace(/<body([^>]*)>/g, '<body$1 suppressHydrationWarning>');

// Write the updated content back to the file
fs.writeFileSync(fileName, updatedContent);
console.log(`Updated ${fileName} with suppressHydrationWarning`);

// Create a Script component to handle browser extensions
const scriptComponentPath = path.join(path.dirname(fileName), 'HydrationScript.jsx');
const scriptComponentContent = `"use client";

// This component helps prevent hydration errors from browser extensions
export default function HydrationScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: \`
          (function() {
            // Remove attributes added by browser extensions
            var observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                if (mutation.attributeName) {
                  var attributeName = mutation.attributeName;
                  if (attributeName.startsWith('data-') || 
                      attributeName.startsWith('cz-') ||
                      attributeName.startsWith('aria-') && !attributeName.startsWith('aria-')) {
                    mutation.target.removeAttribute(attributeName);
                  }
                }
              });
            });
            
            // Start observing the document
            observer.observe(document.documentElement, { 
              attributes: true,
              childList: false,
              subtree: true,
              attributeFilter: ['data-*', 'cz-*', 'aria-*'] 
            });
          })();
        \`,
      }}
    />
  );
}
`;

fs.writeFileSync(scriptComponentPath, scriptComponentContent);
console.log(`Created ${scriptComponentPath} - import and add this component to your layout`);

/**
 * Default viewport configuration for all pages
 * Used to fix Next.js 14.2+ warnings about viewport and themeColor in metadata
 */
export const baseViewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#000000',
  };
  
  /**
   * Function to extend the base viewport with additional properties
   * @param additionalConfig Additional viewport config properties
   * @returns Combined viewport configuration
   */
  export function extendViewport(additionalConfig = {}) {
    return {
      ...baseViewport,
      ...additionalConfig
    };
  }
// Quick debug script to test storage instantiation
import { storage } from './storage';

console.log('Storage instance:', storage);
console.log('Storage constructor:', storage.constructor.name);
console.log('Has getForms method:', typeof storage.getForms);
console.log('All methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(storage)));

// Try to call getForms if it exists
if (typeof storage.getForms === 'function') {
  console.log('Attempting to call getForms...');
  try {
    const forms = await storage.getForms();
    console.log('getForms result:', forms);
  } catch (err) {
    console.error('getForms error:', err);
  }
} else {
  console.log('getForms method not available');
}
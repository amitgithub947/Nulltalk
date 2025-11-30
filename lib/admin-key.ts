// lib/admin-key.ts
// Admin key must be set via ADMIN_KEY environment variable
// Add this to your .env file:
// ADMIN_KEY=your_generated_32_char_key_here
//
// To generate a new key, run:
// node -e "const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let k=''; for(let i=0;i<32;i++)k+=chars[Math.floor(Math.random()*chars.length)]; console.log(k);"

if (!process.env.ADMIN_KEY) {
  throw new Error(
    "ADMIN_KEY environment variable is required. Please set it in your .env file."
  );
}

export const ADMIN_KEY = process.env.ADMIN_KEY;

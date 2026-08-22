const crypto = require('crypto');

/**
 * We are simulating an image perceptual hashing (pHash) implementation.
 * In a real application, you would use a library like `phash-js` or `sharp-phash`.
 * However, pure JS phash implementations require image buffers/pixels.
 * For this backend challenge without real file uploads, we'll implement a mock
 * blockhash function or generate a deterministic hex hash based on a string for demonstration,
 * or use crypto hash if it's just meant to represent an image fingerprint.
 */
exports.generateImageHash = async (imageUrlOrBuffer) => {
  // If it's a mock URL like "car-damage-1.jpg", create a deterministic "pHash"
  // For the sake of the exercise, we create a 64-bit (16 char hex) string
  const md5 = crypto.createHash('md5').update(imageUrlOrBuffer.toString()).digest('hex');
  // Return the first 16 chars to simulate a 64-bit pHash
  return md5.substring(0, 16);
};

/**
 * Calculates the Hamming distance between two hex hashes
 * Hamming distance <= 5 usually indicates a duplicate or very similar image.
 */
exports.calculateHammingDistance = (hash1, hash2) => {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return 100; // Large number if invalid
  }

  // Convert hex to binary strings
  let bin1 = '';
  let bin2 = '';
  for (let i = 0; i < hash1.length; i++) {
    bin1 += parseInt(hash1[i], 16).toString(2).padStart(4, '0');
    bin2 += parseInt(hash2[i], 16).toString(2).padStart(4, '0');
  }

  let distance = 0;
  for (let i = 0; i < bin1.length; i++) {
    if (bin1[i] !== bin2[i]) {
      distance++;
    }
  }

  return distance;
};

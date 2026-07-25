const { customAlphabet } = require('nanoid');

// Base62 alphabet (0-9, a-z, A-Z)
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Create a custom nanoid generator with the Base62 alphabet and 7 character length
const generateBase62 = customAlphabet(alphabet, 7);

module.exports = {
  generateBase62
};

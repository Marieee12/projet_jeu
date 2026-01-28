module.exports = {
  // Environnement de test : DOM simulé (localStorage, classList, events, etc.)
  testEnvironment: "jsdom",

  // Où Jest cherche les tests
  testMatch: [
    "**/tests/**/*.test.cjs",
    "**/tests/**/*.spec.cjs",
    "**/tests/**/*.test.js",
    "**/tests/**/*.spec.js",
    "**/?(*.)+(spec|test).js",
    "**/?(*.)+(spec|test).cjs",
  ],

  // Nettoie automatiquement les mocks entre chaque test
  clearMocks: true,

  // Sortie plus lisible en CI
  verbose: true,
};
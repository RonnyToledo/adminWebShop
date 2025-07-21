const webPush = require("web-push");

// Generar claves públicas y privadas
const keys = webPush.generateVAPIDKeys();
console.log("Public Key:", keys.publicKey);
console.log("Private Key:", keys.privateKey);

// Polyfill pour ReadableStream et autres API Web Streams
// À inclure au début du fichier server.js

const { ReadableStream, WritableStream, TransformStream } = require('stream/web');

// Ajouter les classes au global scope
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;

console.log('Web Streams API polyfill chargé avec succès');

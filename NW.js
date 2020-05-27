let Service = require('node-windows').Service;
 
let svc = new Service({
  name: 'PMSystem',
  description: 'PM management tool',
  script: 'C:/PM/System/Server/server.js' 
});
 
svc.on('install', () => {
  svc.start();
});
 
svc.install();
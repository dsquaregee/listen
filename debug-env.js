import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
console.log('Config Project ID:', config.projectId);
console.log('Env GCS Project ID:', process.env.GCS_PROJECT_ID);
console.log('Env GCS Client Email:', process.env.GCS_CLIENT_EMAIL);

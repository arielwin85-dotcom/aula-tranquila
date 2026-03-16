const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function analyzeFolders() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    // 6to Grado ID
    const targetFolderId = '1bMxCSxNPisyTknApBJg1kzkrHNMlGljm';
    
    const foldersRes = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
      spaces: 'drive',
    });
    
    console.log('--- FILES IN 6TO GRADO ---');
    console.log(JSON.stringify(foldersRes.data.files, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeFolders();

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const folderId = envFile.split('=')[1].trim();

async function analyzeFolders() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    // List all folders to understand the structure
    const foldersRes = await drive.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, parents)',
      spaces: 'drive',
    });
    
    console.log('--- ALL FOLDERS ---');
    foldersRes.data.files.forEach(f => {
       console.log(`- ${f.name} (ID: ${f.id}, Parent: ${f.parents ? f.parents[0] : 'None'})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeFolders();

import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Singleton para evitar reinicializar en cada request
let cachedDrive: any = null;

function getDriveClient() {
  if (cachedDrive) return cachedDrive;

  const credentialsPath = path.join(process.cwd(), 'credentials.json');
  const authOptions: any = {
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  };

  if (process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
    try {
      authOptions.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
    } catch (e) {
      console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS", e);
    }
  } else if (fs.existsSync(credentialsPath)) {
    authOptions.keyFile = credentialsPath;
  } else {
    console.warn("No Google credentials found. Returning mock data.");
    return null;
  }

  const auth = new google.auth.GoogleAuth(authOptions);
  cachedDrive = google.drive({ version: 'v3', auth });
  return cachedDrive;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const drive = getDriveClient();

    if (!drive) {
      return NextResponse.json(getMockResults(query));
    }

    // --- SMART SEARCH SYNTAX ---
    // 1. Detect Grade (Grado)
    let targetFolderId = process.env.DRIVE_FOLDER_ID;

    const lowerQuery = query.toLowerCase();

    const gradeSynonyms: Record<string, string[]> = {
      '1': ['1', 'primer', '1er', '1ro', 'uno'],
      '2': ['2', 'segundo', '2do', 'dos'],
      '3': ['3', 'tercer', '3er', '3ro', 'tres'],
      '4': ['4', 'cuarto', '4to', 'cuatro'],
      '5': ['5', 'quinto', '5to', 'cinco'],
      '6': ['6', 'sexto', '6to', 'seis'],
      '7': ['7', 'septimo', 'séptimo', '7mo', 'siete']
    };

    let detectedGradeStr: string | null = null;
    let explicitGradeQueries: string[] = [];

    for (const [number, synonyms] of Object.entries(gradeSynonyms)) {
      if (synonyms.some(s => lowerQuery.includes(s + ' ') || lowerQuery.endsWith(s) || lowerQuery.includes(' ' + s + ' '))) {
        detectedGradeStr = number;
        explicitGradeQueries = synonyms.map(s => `name contains '${s}'`);
        break;
      }
    }

    const stopWords = ['de', 'para', 'grado', 'año', 'el', 'la', 'los', 'las', 'un', 'una', 'con', 'y', 'o'];
    const tokens = lowerQuery.split(/\s+/).filter(t => t.length > 2 && !stopWords.includes(t));

    const conceptTokens = tokens.filter(t => !detectedGradeStr || !gradeSynonyms[detectedGradeStr].includes(t));

    const textQueries = conceptTokens.map((t: string) => {
      const safeToken = t.replace(/'/g, "\\'");
      return `fullText contains '${safeToken}'`;
    });

    let q = `trashed = false`;

    if (textQueries.length > 0) {
      q += ` and (${textQueries.join(' and ')})`;
    }

    if (detectedGradeStr && explicitGradeQueries.length > 0) {
      let gradeCondition = `(${explicitGradeQueries.join(' or ')})`;

      if (targetFolderId && targetFolderId !== process.env.DRIVE_FOLDER_ID) {
        gradeCondition = `(${gradeCondition} or '${targetFolderId}' in parents)`;
      }

      q += ` and ${gradeCondition}`;
    }

    const response = await drive.files.list({
      q: q,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, createdTime)',
      spaces: 'drive',
      pageSize: 20,
    });

    return NextResponse.json(response.data.files);
  } catch (error) {
    console.error('Drive Search Error:', error);
    return NextResponse.json({ error: 'Failed to search Google Drive' }, { status: 500 });
  }
}

function getMockResults(query: string) {
  return [
    {
      id: 'mock-1',
      name: `Actividad: ${query} - 4to Grado.pdf`,
      mimeType: 'application/pdf',
      webViewLink: '#',
      createdTime: new Date().toISOString()
    },
    {
      id: 'mock-2',
      name: `Secuencia Didáctica: ${query}.docx`,
      mimeType: 'application/vnd.google-apps.document',
      webViewLink: '#',
      createdTime: new Date().toISOString()
    },
    {
      id: 'mock-3',
      name: `Presentación Visual - ${query}.pptx`,
      mimeType: 'application/vnd.google-apps.presentation',
      webViewLink: '#',
      createdTime: new Date(Date.now() - 86400000).toISOString()
    }
  ];
}

import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
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
      console.warn("No Google credentials found (neither env var nor file). Returning mock data.");
      return NextResponse.json(getMockResults(query));
    }

    const auth = new google.auth.GoogleAuth(authOptions);

    const drive = google.drive({ version: 'v3', auth });

    // --- SMART SEARCH SYNTAX ---
    // The previous `targetFolderId in parents` was too restrictive because it doesn't search subfolders.
    // Instead, we will do a global search that:
    // 1. Detect Grade (Grado)
    let targetFolderId = process.env.DRIVE_FOLDER_ID; // Default to root
    
    // Clean up query to remove structural words for the concept search
    const lowerQuery = query.toLowerCase();

    // Map words like "sexto" -> "6", "primer" -> "1"
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

    // Find if the user mentions a specific grade
    for (const [number, synonyms] of Object.entries(gradeSynonyms)) {
      if (synonyms.some(s => lowerQuery.includes(s + ' ') || lowerQuery.endsWith(s) || lowerQuery.includes(' ' + s + ' '))) {
        detectedGradeStr = number;
        // Build OR queries to forcefully match filenames with the numbers or words
        explicitGradeQueries = synonyms.map(s => `name contains '${s}'`);
        break;
      }
    }

    // Clean up query to remove structural words for the concept search
    const stopWords = ['de', 'para', 'grado', 'año', 'el', 'la', 'los', 'las', 'un', 'una', 'con', 'y', 'o'];
    const tokens = lowerQuery.split(/\s+/).filter(t => t.length > 2 && !stopWords.includes(t));
    
    // We remove the grade words from the concept tokens so it doesn't mess up fulltext
    const conceptTokens = tokens.filter(t => !detectedGradeStr || !gradeSynonyms[detectedGradeStr].includes(t));

    const textQueries = conceptTokens.map((t: string) => {
      const safeToken = t.replace(/'/g, "\\'");
      return `fullText contains '${safeToken}'`;
    });
    
    let q = `trashed = false`;
    
    // Require concept matches
    if (textQueries.length > 0) {
       q += ` and (${textQueries.join(' and ')})`;
    }

    // Force strict grade matching: Either the grade is in the filename OR the file is inside a known grade folder
    if (detectedGradeStr && explicitGradeQueries.length > 0) {
       // Only apply the folder restriction here to allow global searches when no grade is specified
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

// Helper function to return realistic mock data for UI testing
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

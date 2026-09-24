export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink?: string;
  thumbnailLink?: string;
  size: number;
}

let cachedFolderId: string | null = null;

/**
 * Finds or creates a designated "PrintCraft Artwork Uploads" folder in Google Drive.
 */
export async function getOrCreateUploadsFolder(
  accessToken: string,
  folderName: string = 'PrintCraft Artwork Uploads'
): Promise<string> {
  if (cachedFolderId) return cachedFolderId;

  try {
    // Search for existing folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
      )}&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        cachedFolderId = data.files[0].id;
        return cachedFolderId!;
      }
    }

    // Create folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    if (createRes.ok) {
      const folderData = await createRes.json();
      cachedFolderId = folderData.id;
      return cachedFolderId!;
    }
  } catch (err) {
    console.warn('Could not create folder, uploading to root:', err);
  }

  return 'root';
}

/**
 * Uploads a user's print file directly to Google Drive using multipart upload.
 */
export async function uploadFileToGoogleDrive(
  accessToken: string,
  file: File,
  folderId?: string
): Promise<DriveUploadResult> {
  const targetFolderId = folderId || (await getOrCreateUploadsFolder(accessToken));

  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    parents: targetFolderId !== 'root' ? [targetFolderId] : []
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  const encoder = new TextEncoder();
  const metadataBuffer = encoder.encode(metadataPart);
  const mediaHeaderBuffer = encoder.encode(mediaHeader);
  const closeDelimiterBuffer = encoder.encode(closeDelimiter);

  // Combine into single Uint8Array
  const combined = new Uint8Array(
    metadataBuffer.byteLength +
    mediaHeaderBuffer.byteLength +
    fileArrayBuffer.byteLength +
    closeDelimiterBuffer.byteLength
  );

  let offset = 0;
  combined.set(metadataBuffer, offset);
  offset += metadataBuffer.byteLength;
  combined.set(mediaHeaderBuffer, offset);
  offset += mediaHeaderBuffer.byteLength;
  combined.set(new Uint8Array(fileArrayBuffer), offset);
  offset += fileArrayBuffer.byteLength;
  combined.set(closeDelimiterBuffer, offset);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size,thumbnailLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: combined
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to upload file to Google Drive (${response.status})`);
  }

  const result = await response.json();
  return {
    fileId: result.id,
    fileName: result.name,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    thumbnailLink: result.thumbnailLink,
    size: file.size
  };
}

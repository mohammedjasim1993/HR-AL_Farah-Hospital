// Pure TypeScript Zero-Dependency ZIP Archive Builder
// Fully compliant with PKZip standard and compatible with Windows, Mac, Linux, WinRAR, 7-Zip

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

export function crc32(buf: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export interface ZipFileInput {
  name: string;
  data: Uint8Array | ArrayBuffer | string;
}

export function createZipBlob(files: ZipFileInput[]): Blob {
  const encoder = new TextEncoder();
  const fileEntries: {
    nameBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  const parts: Uint8Array[] = [];
  let currentOffset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    let dataBytes: Uint8Array;
    if (typeof file.data === 'string') {
      dataBytes = encoder.encode(file.data);
    } else if (file.data instanceof Uint8Array) {
      dataBytes = file.data;
    } else {
      dataBytes = new Uint8Array(file.data);
    }

    const crc = crc32(dataBytes);
    const offset = currentOffset;

    // Local file header (30 bytes + filename length)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed to extract (2.0)
    view.setUint16(6, 0x0800, true);     // General purpose bit flag (UTF-8 filename)
    view.setUint16(8, 0, true);          // Compression method (0 = store / uncompressed)
    view.setUint16(10, 0, true);         // File last mod time
    view.setUint16(12, 0, true);         // File last mod date
    view.setUint32(14, crc, true);       // CRC-32
    view.setUint32(18, dataBytes.length, true); // Compressed size
    view.setUint32(22, dataBytes.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // Filename length
    view.setUint16(28, 0, true);         // Extra field length

    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(dataBytes);

    currentOffset += localHeader.length + dataBytes.length;

    fileEntries.push({
      nameBytes,
      dataBytes,
      crc,
      offset
    });
  }

  // Central Directory
  const centralDirStartOffset = currentOffset;
  let centralDirSize = 0;

  for (const entry of fileEntries) {
    // Central directory file header (46 bytes + filename length)
    const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central file header signature
    view.setUint16(4, 20, true);         // Version made by (2.0)
    view.setUint16(6, 20, true);         // Version needed to extract (2.0)
    view.setUint16(8, 0x0800, true);     // General purpose bit flag (UTF-8)
    view.setUint16(10, 0, true);        // Compression method (0 = store)
    view.setUint16(12, 0, true);        // Last mod time
    view.setUint16(14, 0, true);        // Last mod date
    view.setUint32(16, entry.crc, true);// CRC-32
    view.setUint32(20, entry.dataBytes.length, true); // Compressed size
    view.setUint32(24, entry.dataBytes.length, true); // Uncompressed size
    view.setUint16(28, entry.nameBytes.length, true); // Filename length
    view.setUint16(30, 0, true);        // Extra field length
    view.setUint16(32, 0, true);        // File comment length
    view.setUint16(34, 0, true);        // Disk number start
    view.setUint16(36, 0, true);        // Internal file attributes
    view.setUint32(38, 0, true);        // External file attributes
    view.setUint32(42, entry.offset, true); // Relative offset of local header

    cdHeader.set(entry.nameBytes, 46);

    parts.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  eocdView.setUint32(0, 0x06054b50, true); // End of central dir signature
  eocdView.setUint16(4, 0, true);          // Number of this disk
  eocdView.setUint16(6, 0, true);          // Disk where central directory starts
  eocdView.setUint16(8, fileEntries.length, true);  // Number of central directory records on this disk
  eocdView.setUint16(10, fileEntries.length, true); // Total number of central directory records
  eocdView.setUint32(12, centralDirSize, true);     // Size of central directory
  eocdView.setUint32(16, centralDirStartOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true);         // Comment length

  parts.push(eocd);

  return new Blob(parts, { type: 'application/zip' });
}

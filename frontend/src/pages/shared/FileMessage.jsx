// FileMessage component - handles both images and documents
// For documents, uses JS blob download to force correct filename + extension

const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Determine correct MIME type from filename
    let mimeType = blob.type;
    if (filename.endsWith('.pdf') && mimeType === 'application/octet-stream') {
      mimeType = 'application/pdf';
    }
    
    const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename; // forces browser to use this exact filename
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
};

const FileMessage = ({ file }) => {
  if (file.fileType === 'image') {
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer">
        <img
          src={file.url}
          alt={file.originalName}
          style={{ maxWidth: '220px', maxHeight: '180px', borderRadius: '8px', display: 'block' }}
        />
      </a>
    );
  }

  return (
    <button
      onClick={() => downloadFile(file.url, file.originalName)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '8px',
        color: 'inherit',
        textDecoration: 'none',
        border: '1px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        fontSize: '0.875rem',
      }}
    >
      <span>📄</span>
      <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {file.originalName}
      </span>
      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>↓</span>
    </button>
  );
};

export default FileMessage;

const openPdfBlob = (blob) => {
  const pdfBlob = new Blob([blob], {
    type: "application/pdf",
  });

  const pdfUrl = window.URL.createObjectURL(pdfBlob);

  window.open(pdfUrl, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    window.URL.revokeObjectURL(pdfUrl);
  }, 60 * 1000);
};

export default openPdfBlob;

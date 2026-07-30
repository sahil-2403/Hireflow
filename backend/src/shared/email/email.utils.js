const escapeHtml = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const normalizeRecipientName = (value) => {
  const normalizedName = String(value ?? "").trim();

  return normalizedName || "there";
};

export { escapeHtml, normalizeRecipientName };

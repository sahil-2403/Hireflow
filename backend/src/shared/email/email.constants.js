const getEmailBrandLogoUrl = () => {
  const logoUrl = process.env.EMAIL_BRAND_LOGO_URL;

  if (!logoUrl) {
    throw new Error("EMAIL_BRAND_LOGO_URL is required");
  }

  return logoUrl;
};

export { getEmailBrandLogoUrl };

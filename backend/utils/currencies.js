// مفاتيح الكائن هي أكواد الدول (ISO 2-Letter)
export const globalCurrencies = {
  EG: { code: 'EGP', symbol: 'EGP', name: 'Egyptian Pound', defaultRate: 52 , shippingFee: 100 },
  SA: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', defaultRate: 3.75 , shippingFee: 100 },
  AE: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', defaultRate: 3.67 },
  KW: { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar', defaultRate: 0.31 },
  QA: { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', defaultRate: 3.64 },
  OM: { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', defaultRate: 0.38 },
  BH: { code: 'BHD', symbol: 'BHD', name: 'Bahraini Dinar', defaultRate: 0.38 },
  JO: { code: 'JOD', symbol: 'JOD', name: 'Jordanian Dinar', defaultRate: 0.71 },
  LB: { code: 'LBP', symbol: 'LBP', name: 'Lebanese Pound', defaultRate: 89500 },
  IQ: { code: 'IQD', symbol: 'IQD', name: 'Iraqi Dinar', defaultRate: 1310 },
  DZ: { code: 'DZD', symbol: 'DZD', name: 'Algerian Dinar', defaultRate: 134 },
  MA: { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', defaultRate: 10.05 },
  TN: { code: 'TND', symbol: 'TND', name: 'Tunisian Dinar', defaultRate: 3.13 },
  LY: { code: 'LYD', symbol: 'LYD', name: 'Libyan Dinar', defaultRate: 4.85 },
  SD: { code: 'SDG', symbol: 'SDG', name: 'Sudanese Pound', defaultRate: 600 }, 
  SY: { code: 'SYP', symbol: 'SYP', name: 'Syrian Pound', defaultRate: 13000 },
  YE: { code: 'YER', symbol: 'YER', name: 'Yemeni Rial', defaultRate: 250 },

  // --- الأسواق العالمية الكبرى ---
  US: { code: 'USD', symbol: '$', name: 'US Dollar', defaultRate: 1 },
  GB: { code: 'GBP', symbol: '£', name: 'British Pound', defaultRate: 0.79 },
  
  // --- دول الاتحاد الأوروبي (منفصلة لضبط الهاتف والعملة الموحدة) ---
  FR: { code: 'EUR', symbol: '€', name: 'Euro (France)', defaultRate: 0.92 },
  DE: { code: 'EUR', symbol: '€', name: 'Euro (Germany)', defaultRate: 0.92 },
  ES: { code: 'EUR', symbol: '€', name: 'Euro (Spain)', defaultRate: 0.92 },
  IT: { code: 'EUR', symbol: '€', name: 'Euro (Italy)', defaultRate: 0.92 },
  NL: { code: 'EUR', symbol: '€', name: 'Euro (Netherlands)', defaultRate: 0.92 },
  BE: { code: 'EUR', symbol: '€', name: 'Euro (Belgium)', defaultRate: 0.92 },
  AT: { code: 'EUR', symbol: '€', name: 'Euro (Austria)', defaultRate: 0.92 },
  IE: { code: 'EUR', symbol: '€', name: 'Euro (Ireland)', defaultRate: 0.92 },
  PT: { code: 'EUR', symbol: '€', name: 'Euro (Portugal)', defaultRate: 0.92 },

  // --- باقي الأسواق العالمية ---
  CA: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', defaultRate: 1.36 },
  AU: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', defaultRate: 1.52 },
  JP: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', defaultRate: 154.50 },
  CN: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', defaultRate: 7.24 },
  IN: { code: 'INR', symbol: '₹', name: 'Indian Rupee', defaultRate: 83.50 },
  TR: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', defaultRate: 32.50 },
  RU: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', defaultRate: 93.00 },
  ZA: { code: 'ZAR', symbol: 'R', name: 'South African Rand', defaultRate: 18.80 },
  NG: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', defaultRate: 1150 },
  BR: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', defaultRate: 5.15 },
};

// فنكشن لتنسيق الرقم حسب العملة
export const formatCurrency = (amount, currencyCode) => {
  const safeCode = currencyCode || 'USD'; 
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCode,
    }).format(amount);
  } catch (error) {
    return `${amount} ${safeCode}`;
  }
};
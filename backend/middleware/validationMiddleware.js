// دالة التأكد من الإيميل
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// دالة التأكد من التليفون المصري
const isValidPhone = (phone) => /^01[0125][0-9]{8}$/.test(phone);

// دالة فحص بيانات التسجيل (Register)
export const validateRegisterInput = (data) => {
  const { name, email, phone, password } = data; // بنسحبهم من الداتا اللي جاية

  if (!name || name.trim().length < 3) return "Name must be at least 3 characters";
  if (!email || !isValidEmail(email)) return "Invalid email format";
  if (!phone || !isValidPhone(phone)) return "Invalid Egyptian phone number (11 digits)";
  if (!password || password.length < 8) return "Password must be at least 8 characters";

  return null; // كلو تمام
};

// دالة فحص إيميل نسيت كلمة السر
export const validateForgotInput = (email) => {
  if (!email || !isValidEmail(email)) return "Please provide a valid email";
  return null;
};
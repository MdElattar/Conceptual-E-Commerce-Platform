import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  // رجع التوكن عشان نستخدمه في الـ Controller
  return token; 
};

export default generateToken;
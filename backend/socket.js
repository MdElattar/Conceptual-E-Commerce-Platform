import io from 'socket.io-client';

const ENDPOINT = "http://localhost:5000"; // تأكد إنه نفس بورت السيرفر
const socket = io(ENDPOINT, { autoConnect: false });

export default socket;
// Khởi tạo Firebase App + Auth providers cho Google và Facebook OAuth
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

const app = initializeApp({
  apiKey:            'AIzaSyB5_VhDytOG3mdII5ZXe1yNjarWCFUX0oo',
  authDomain:        'connectclean-945f3.firebaseapp.com',
  projectId:         'connectclean-945f3',
  storageBucket:     'connectclean-945f3.firebasestorage.app',
  messagingSenderId: '440859697732',
  appId:             '1:440859697732:web:d797398a1da9ad09245211',
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

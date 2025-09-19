import dotenv from "dotenv";
import { FirebaseAuthProvider } from './firebase.provider';
import { AuthService } from './auth.service';
dotenv.config();

const firebaseApiKey = process.env.FIREBASE_API_KEY ?? '';
const jwtSecret = process.env.JWT_SECRET ?? '';
const jwtTtl = Number(process.env.JWT_EXPIRES_IN ?? '3600');

const provider = new FirebaseAuthProvider(firebaseApiKey);

export const authService = new AuthService(provider, jwtSecret, jwtTtl);
export * from '../../types/auth';
export { AuthService };

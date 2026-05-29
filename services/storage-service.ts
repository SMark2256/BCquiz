import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { firebaseStorage, isFirebaseConfigured } from '@/lib/firebase';
import type { ApiResponse } from '@/types';

// Upload image to Firebase Storage
export async function uploadImage(
  file: File,
  path: string
): Promise<ApiResponse<string>> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const storageRef = ref(firebaseStorage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { success: true, data: downloadUrl };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}

// Delete image from Firebase Storage
export async function deleteImage(path: string): Promise<ApiResponse<void>> {
  if (!isFirebaseConfigured()) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const storageRef = ref(firebaseStorage, path);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: 'Failed to delete image' };
  }
}

// Generate a unique path for uploaded images
export function generateImagePath(
  type: 'quizzes' | 'events' | 'topics',
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${type}/${timestamp}_${sanitizedName}`;
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { usePalaces, usePalace } from '../hooks/usePalaces';
import { savePhoto, getPhotoUrl, deletePhoto as deletePhotoStorage } from '../services/photoStorage';
import { lore } from '../lib/lore';
import styles from './PalaceForm.module.css';

export function PalaceForm() {
  const { palaceId } = useParams();
  const isEditing = !!palaceId;
  const existingPalace = usePalace(palaceId ? Number(palaceId) : undefined);
  const { addPalace, updatePalace, deletePalace } = usePalaces();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [imageId, setImageId] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (existingPalace) {
      setName(existingPalace.name);
      setDescription(existingPalace.description ?? '');
      setAddress(existingPalace.address ?? '');
      setImageId(existingPalace.imageId);
      setImageUrl(existingPalace.imageUrl);

      if (existingPalace.imageId) {
        getPhotoUrl(existingPalace.imageId)
          .then((url) => setImagePreview(url))
          .catch(() => {
            // Fall back to imageUrl if imageId fails
            if (existingPalace.imageUrl) setImagePreview(existingPalace.imageUrl);
          });
      } else if (existingPalace.imageUrl) {
        setImagePreview(existingPalace.imageUrl);
      }
    }
  }, [existingPalace]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const photo = await savePhoto(file, { caption: 'Palace artwork' });
      setImageId(photo.id);
      setImageUrl(undefined); // Uploaded image replaces static imageUrl
      const url = await getPhotoUrl(photo.id);
      setImagePreview(url);
    } catch {
      // Failed to upload
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveImage() {
    if (imageId) {
      try {
        await deletePhotoStorage(imageId);
      } catch {
        // Ignore
      }
    }
    setImageId(undefined);
    setImageUrl(undefined);
    setImagePreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isEditing && existingPalace) {
      await updatePalace(existingPalace.id!, {
        name,
        description: description || undefined,
        address: address || undefined,
        imageId,
        imageUrl,
      });
      navigate(`/palace/${existingPalace.id}`);
    } else {
      const newId = await addPalace({
        name,
        description: description || undefined,
        address: address || undefined,
        imageId,
        imageUrl,
        isDefault: false,
      });
      navigate(`/palace/${newId}`, { replace: true });
    }
  }

  async function handleDelete() {
    if (!existingPalace) return;
    if (window.confirm(lore.palace.deleteConfirm)) {
      await deletePalace(existingPalace.id!);
      navigate('/');
    }
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Palace' : lore.palace.newPalace}
        showBack
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="Palace Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Home"
          required
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />

        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Optional address"
        />

        {/* Image upload */}
        <div className={styles.imageSection}>
          <label className={styles.imageLabel}>Palace Artwork</label>
          {imagePreview ? (
            <div className={styles.imagePreview}>
              <img src={imagePreview} alt="Palace artwork" className={styles.previewImg} />
              <button type="button" className={styles.removeImg} onClick={handleRemoveImage}>
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hidden}
            onChange={handleImageUpload}
          />
          <p className={styles.imageHint}>
            Upload a floor plan or photo. Rooms can be mapped as hotspots on this image.
          </p>
        </div>

        <div className={styles.actions}>
          {isEditing && (
            <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
              Delete Palace
            </Button>
          )}
          <div className={styles.spacer} />
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Changes' : 'Create Palace'}
          </Button>
        </div>
      </form>
    </div>
  );
}

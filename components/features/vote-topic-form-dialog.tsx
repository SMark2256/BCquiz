// 'use client';
//
// import { useState } from 'react';
// import Image from 'next/image';
// import { ImageIcon } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { SearchAndSelect, type MediaItem } from './search-and-select';
// import type { VoteTopic, VoteTopicFormData, ApiResponse } from '@/types';
//
// interface VoteTopicFormDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSubmit: (data: VoteTopicFormData) => Promise<ApiResponse<VoteTopic>>;
//   topic?: VoteTopic | null;
// }

// export function VoteTopicFormDialog({
//   open,
//   onOpenChange,
//   onSubmit,
//   topic,
// }: VoteTopicFormDialogProps) {
//   const [loading, setLoading] = useState(false);
//   const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
//   const [formData, setFormData] = useState<{
//     title: string;
//     description: string;
//     isActive: boolean;
//     imageUrl: string;
//   }>({
//     title: topic?.title || '',
//     description: topic?.description || '',
//     isActive: topic?.isActive || false,
//     imageUrl: topic?.imageUrl || '',
//   });
//
//   const handleMediaSelect = (item: MediaItem) => {
//     setSelectedMedia(item);
//     setFormData({
//       ...formData,
//       title: item.title,
//       description: item.description || formData.description,
//       isActive: formData.isActive,
//       imageUrl: item.imageUrl || '',
//     });
//   };
//
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//
//     const data: VoteTopicFormData = {
//       title: formData.title,
//       description: formData.description || undefined,
//       isActive: formData.isActive || false,
//       imageUrl: formData.imageUrl || undefined,
//     };
//
//     const result = await onSubmit(data);
//
//     if (result.success) {
//       // Reset form
//       setFormData({ title: '', description: '', imageUrl: '' });
//       setSelectedMedia(null);
//     }
//
//     setLoading(false);
//   };
//
//   const handleClose = (isOpen: boolean) => {
//     if (!isOpen) {
//       setFormData({ title: '', description: '', imageUrl: '' });
//       setSelectedMedia(null);
//     }
//     onOpenChange(isOpen);
//   };
//
//   const isEditing = !!topic;
//
//   return (
//     <Dialog open={open} onOpenChange={handleClose}>
//       <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
//         <DialogHeader>
//           <DialogTitle>
//             {isEditing ? 'Téma Szerkesztése' : 'Új Szavazási Téma'}
//           </DialogTitle>
//           <DialogDescription>
//             {isEditing
//               ? 'Módosítsd a szavazási téma adatait.'
//               : 'Adj hozzá egy új témát, amire a látogatók szavazhatnak.'}
//           </DialogDescription>
//         </DialogHeader>
//
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Media Search */}
//           <div className="space-y-2">
//             <Label>Media Keresése</Label>
//             <SearchAndSelect
//               onSelect={handleMediaSelect}
//               selectedTitle={selectedMedia?.title}
//             />
//             <p className="text-xs text-muted-foreground">
//               Keress filmeket, sorozatokat vagy könyveket a TMDb és Google Books adatbázisában.
//             </p>
//           </div>
//
//           {/* Preview of selected media */}
//           {(selectedMedia || formData.imageUrl) && (
//             <div className="flex items-start gap-4 rounded-lg border bg-muted/50 p-4">
//               {formData.imageUrl ? (
//                 <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
//                   <Image
//                     src={formData.imageUrl}
//                     alt={formData.title}
//                     fill
//                     className="object-cover"
//                   />
//                 </div>
//               ) : (
//                 <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted">
//                   <ImageIcon className="size-8 text-muted-foreground" />
//                 </div>
//               )}
//               <div className="flex-1 min-w-0">
//                 <p className="font-medium truncate">{formData.title || 'Nincs cím'}</p>
//                 {selectedMedia?.category && (
//                   <p className="text-sm text-muted-foreground">{selectedMedia.category}</p>
//                 )}
//               </div>
//             </div>
//           )}
//
//           {/* Title */}
//           <div className="space-y-2">
//             <Label htmlFor="title">Cím *</Label>
//             <Input
//               id="title"
//               value={formData.title}
//               onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//               placeholder="pl. Rick and Morty"
//               required
//             />
//           </div>
//
//           {/* Description */}
//           <div className="space-y-2">
//             <Label htmlFor="description">Leírás</Label>
//             <Textarea
//               id="description"
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               placeholder="Rövid leírás a témáról..."
//               rows={2}
//             />
//           </div>
//
//           {/* Image URL */}
//           <div className="space-y-2">
//             <Label htmlFor="imageUrl">Kép URL</Label>
//             <Input
//               id="imageUrl"
//               type="url"
//               value={formData.imageUrl}
//               onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
//               placeholder="https://..."
//             />
//             <p className="text-xs text-muted-foreground">
//               Automatikusan kitöltődik a keresésből, de manuálisan is megadható.
//             </p>
//           </div>
//
//           <DialogFooter>
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => handleClose(false)}
//               disabled={loading}
//             >
//               Mégse
//             </Button>
//             <Button type="submit" disabled={loading || !formData.title}>
//               {loading ? 'Mentés...' : isEditing ? 'Mentés' : 'Létrehozás'}
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }

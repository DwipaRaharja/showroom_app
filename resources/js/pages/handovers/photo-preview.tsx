import {
    CaretLeftIcon,
    CaretRightIcon,
    FileArrowDownIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import VehicleHandoverController from '@/actions/App/Http/Controllers/VehicleHandoverController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { VehicleHandoverPhoto } from '@/pages/sales/types';

type Props = {
    photos: VehicleHandoverPhoto[];
};

export function HandoverPhotoPreview({ photos }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentPhoto = photos[currentIndex];

    if (!currentPhoto) {
        return null;
    }

    function selectPrevious() {
        setCurrentIndex((index) =>
            index === 0 ? photos.length - 1 : index - 1,
        );
    }

    function selectNext() {
        setCurrentIndex((index) =>
            index === photos.length - 1 ? 0 : index + 1,
        );
    }

    return (
        <Dialog
            onOpenChange={(open) => {
                if (!open) {
                    setCurrentIndex(0);
                }
            }}
        >
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="group flex items-center gap-2 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label={`Lihat ${photos.length} foto bukti penyerahan`}
                >
                    <span className="relative block h-14 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        <img
                            src={VehicleHandoverController.showPhoto.url(
                                photos[0].id,
                            )}
                            alt="Foto bukti penyerahan pertama"
                            loading="lazy"
                            className="size-full object-cover transition-transform group-hover:scale-105"
                        />
                        {photos.length > 1 && (
                            <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                +{photos.length - 1}
                            </span>
                        )}
                    </span>
                    <span className="grid gap-0.5">
                        <span className="text-xs font-medium text-foreground">
                            {photos.length} foto
                        </span>
                        <span className="text-[11px] text-primary">
                            Klik untuk melihat
                        </span>
                    </span>
                </button>
            </DialogTrigger>

            <DialogContent className="max-w-5xl overflow-hidden p-0">
                <DialogHeader className="border-b px-5 py-4 pr-12">
                    <DialogTitle>Foto Bukti Penyerahan</DialogTitle>
                    <DialogDescription>
                        {currentPhoto.file_name} · Foto {currentIndex + 1} dari{' '}
                        {photos.length}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 px-4 sm:px-6">
                    <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-xl bg-black/95">
                        <img
                            key={currentPhoto.id}
                            src={VehicleHandoverController.showPhoto.url(
                                currentPhoto.id,
                            )}
                            alt={`Foto bukti penyerahan ${currentIndex + 1}`}
                            className="max-h-[65vh] w-full object-contain"
                        />

                        {photos.length > 1 && (
                            <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    onClick={selectPrevious}
                                    aria-label="Foto sebelumnya"
                                    className="absolute left-3 rounded-full shadow-lg"
                                >
                                    <CaretLeftIcon />
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    onClick={selectNext}
                                    aria-label="Foto berikutnya"
                                    className="absolute right-3 rounded-full shadow-lg"
                                >
                                    <CaretRightIcon />
                                </Button>
                            </>
                        )}
                    </div>

                    {photos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {photos.map((photo, index) => (
                                <button
                                    key={photo.id}
                                    type="button"
                                    onClick={() => setCurrentIndex(index)}
                                    aria-label={`Tampilkan foto ${index + 1}`}
                                    aria-pressed={index === currentIndex}
                                    className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 border-transparent bg-muted aria-pressed:border-primary"
                                >
                                    <img
                                        src={VehicleHandoverController.showPhoto.url(
                                            photo.id,
                                        )}
                                        alt=""
                                        loading="lazy"
                                        className="size-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t px-5 py-4 sm:px-6">
                    <Button variant="outline" asChild>
                        <a
                            href={VehicleHandoverController.downloadPhoto.url(
                                currentPhoto.id,
                            )}
                        >
                            <FileArrowDownIcon />
                            Unduh foto
                        </a>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

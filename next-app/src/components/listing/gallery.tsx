"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon, Images } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useSlideIndex(api: CarouselApi | undefined) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);
  return index;
}

function Lightbox({
  images,
  name,
  open,
  startIndex,
  onOpenChange,
}: {
  images: string[];
  name: string;
  open: boolean;
  startIndex: number;
  onOpenChange: (open: boolean) => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const index = useSlideIndex(api);

  useEffect(() => {
    if (open && api) api.scrollTo(startIndex, true);
  }, [open, api, startIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl gap-3 border-0 bg-black p-3 text-white sm:rounded-xl sm:p-4 [&>button]:text-white">
        <DialogTitle className="pr-8 text-sm font-medium text-white/90">
          {name} · Photo {index + 1} of {images.length}
        </DialogTitle>
        <DialogDescription className="sr-only">Use the arrow keys or swipe to browse photos.</DialogDescription>
        <Carousel setApi={setApi} opts={{ startIndex, loop: images.length > 1 }} className="w-full">
          <CarouselContent>
            {images.map((src, i) => (
              <CarouselItem key={`${i}:${src}`}>
                <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                  <Image
                    src={src}
                    alt={`${name} photo ${i + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1024px"
                    className="object-contain"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        {images.length > 1 ? (
          <div className="flex items-center justify-between gap-2">
            <Button variant="secondary" size="icon" onClick={() => api?.scrollPrev()} aria-label="Previous photo">
              <ChevronLeft />
            </Button>
            <div className="flex gap-1.5 overflow-x-auto py-1">
              {images.map((src, i) => (
                <button
                  key={`${i}:${src}`}
                  type="button"
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "relative h-10 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-opacity",
                    i === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <Image src={src} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
            <Button variant="secondary" size="icon" onClick={() => api?.scrollNext()} aria-label="Next photo">
              <ChevronRight />
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Swipe carousel on phones, photo grid on desktop, full-screen lightbox for both. */
export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const index = useSlideIndex(api);

  const openAt = (i: number) => {
    setStartIndex(i);
    setOpen(true);
  };

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-xl border bg-muted text-muted-foreground">
        <div className="flex flex-col items-center gap-2 text-sm">
          <ImageIcon className="size-8" aria-hidden />
          Photos coming soon
        </div>
      </div>
    );
  }

  const tiles = images.slice(1, 5);

  return (
    <>
      {/* Mobile: swipe carousel */}
      <div className="relative -mx-4 sm:mx-0 md:hidden">
        <Carousel setApi={setApi} opts={{ loop: images.length > 1 }} aria-label={`${name} photos`}>
          <CarouselContent className="ml-0">
            {images.map((src, i) => (
              <CarouselItem key={`${i}:${src}`} className="pl-0">
                <button
                  type="button"
                  onClick={() => openAt(i)}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-muted sm:rounded-xl"
                  aria-label={`Open photo ${i + 1} of ${images.length}`}
                >
                  <Image
                    src={src}
                    alt={`${name} photo ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-cover"
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white">
          {index + 1} / {images.length}
        </span>
      </div>

      {/* Desktop: grid */}
      <div
        className={cn(
          "relative hidden gap-2 overflow-hidden rounded-xl md:grid",
          tiles.length > 0 ? "h-[420px] grid-cols-4 grid-rows-2" : "h-[420px] grid-cols-1"
        )}
      >
        <button
          type="button"
          onClick={() => openAt(0)}
          className={cn(
            "group relative overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            tiles.length > 0 && "col-span-2 row-span-2"
          )}
          aria-label="Open photo 1"
        >
          <Image
            src={images[0]!}
            alt={`${name} photo 1`}
            fill
            priority
            sizes="(max-width: 1280px) 50vw, 640px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </button>
        {tiles.map((src, i) => (
          <button
            key={`${i}:${src}`}
            type="button"
            onClick={() => openAt(i + 1)}
            className={cn(
              "group relative overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tiles.length === 1 && "col-span-2 row-span-2",
              tiles.length === 2 && "col-span-2",
              tiles.length === 3 && i === 0 && "col-span-2"
            )}
            aria-label={`Open photo ${i + 2}`}
          >
            <Image
              src={src}
              alt={`${name} photo ${i + 2}`}
              fill
              sizes="(max-width: 1280px) 25vw, 320px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>
        ))}
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-3 right-3 bg-background/95 shadow-md hover:bg-background"
          onClick={() => openAt(0)}
        >
          <Images /> View all {images.length} photos
        </Button>
      </div>

      <Lightbox images={images} name={name} open={open} startIndex={startIndex} onOpenChange={setOpen} />
    </>
  );
}

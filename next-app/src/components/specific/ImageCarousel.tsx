import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

interface ImageCarouselProps {
  images: string[] | null;
}

const ImageCarousel = ({ images }: ImageCarouselProps) => {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  );
  return (
    <div>
      <Carousel
        plugins={[plugin.current]}
        className="w-full  mx-auto  rounded-lg   relative"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {images &&
            images.map((image, index) => (
              <CarouselItem
                key={index}
                className="flex h-[300px] items-center justify-center"
              >
                <div className=" flex items-center justify-center">
                  <Image
                    src={image}
                    alt={`Image ${index}`}
                    width={500}
                    height={300}
                    className="object-contain"
                  />
                </div>
              </CarouselItem>
            ))}
        </CarouselContent>
        <div className="absolute z-50 flex justify-between  left-16 right-16 top-1/2">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>
    </div>
  );
};

export default ImageCarousel;

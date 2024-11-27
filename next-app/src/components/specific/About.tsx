"use client";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";

const About = () => {
  return (
    <>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]}
      >
        <CarouselContent className="">
          <CarouselItem className="md:basis-1/2 lg:basis-1/4 bg-[url('/assets/city-line-art.png')] bg-repeat-x bg-bottom bg-[#FF5733] bg-contain flex  p-4  h-[250px] mx-2">
            <div className="text-white flex-1">
              <h3>Instant Discount</h3>
              <h1 className="text-3xl font-bold">Gurgaon</h1>
              <div className="flex space-x-2 items-center mt-2">
                <span>500 off rent:</span>{" "}
                <div className="font-semibold p-1 rounded-md flex justify-center bg-white text-black">
                  PGGU500
                </div>
              </div>
              <span className="text-xs">*Valid only on 1 month booking</span>
            </div>
            <div>
              <Image src="/icons/logo.png" alt="logo" width={80} height={80} />
            </div>
          </CarouselItem>
          <CarouselItem className="md:basis-1/2 lg:basis-1/4 bg-[url('/assets/city-line-art.png')] bg-repeat-x bg-bottom bg-primary1 bg-contain flex  p-4  h-[250px] mx-2">
            <div className="text-white flex-1">
              <h3>Instant Discount</h3>
              <h1 className="text-3xl font-bold">Gurgaon</h1>
              <div className="flex space-x-2 items-center mt-2">
                <span>500 off rent:</span>{" "}
                <div className="font-semibold p-1 rounded-md flex justify-center bg-white text-black">
                  PGGU500
                </div>
              </div>
              <span className="text-xs">*Valid only on 1 month booking</span>
            </div>
            <div>
              <Image src="/icons/logo.png" alt="logo" width={80} height={80} />
            </div>
          </CarouselItem>
          <CarouselItem className="md:basis-1/2 lg:basis-1/4 bg-[url('/assets/city-line-art.png')] bg-repeat-x bg-bottom bg-[#ffc107] bg-contain flex  p-4  h-[250px] mx-2">
            <div className="text-white flex-1">
              <h3>Instant Discount</h3>
              <h1 className="text-3xl font-bold">Gurgaon</h1>
              <div className="flex space-x-2 items-center mt-2">
                <span>500 off rent:</span>{" "}
                <div className="font-semibold p-1 rounded-md flex justify-center bg-white text-black">
                  PGGU500
                </div>
              </div>
              <span className="text-xs">*Valid only on 1 month booking</span>
            </div>
            <div>
              <Image src="/icons/logo.png" alt="logo" width={80} height={80} />
            </div>
          </CarouselItem>
          <CarouselItem className="md:basis-1/2 lg:basis-1/4 bg-[url('/assets/city-line-art.png')] bg-repeat-x bg-bottom bg-[#FF5733] bg-contain flex  p-4  h-[250px] mx-2">
            <div className="text-white flex-1">
              <h3>Instant Discount</h3>
              <h1 className="text-3xl font-bold">Gurgaon</h1>
              <div className="flex space-x-2 items-center mt-2">
                <span>500 off rent:</span>{" "}
                <div className="font-semibold p-1 rounded-md flex justify-center bg-white text-black">
                  PGGU500
                </div>
              </div>
              <span className="text-xs">*Valid only on 1 month booking</span>
            </div>
            <div>
              <Image src="/icons/logo.png" alt="logo" width={80} height={80} />
            </div>
          </CarouselItem>
          <CarouselItem className="md:basis-1/2 lg:basis-1/4 bg-[url('/assets/city-line-art.png')] bg-repeat-x bg-bottom bg-primary1 bg-contain flex  p-4  h-[250px] mx-2">
            <div className="text-white flex-1">
              <h3>Instant Discount</h3>
              <h1 className="text-3xl font-bold">Gurgaon</h1>
              <div className="flex space-x-2 items-center mt-2">
                <span>500 off rent:</span>{" "}
                <div className="font-semibold p-1 rounded-md flex justify-center bg-white text-black">
                  PGGU500
                </div>
              </div>
              <span className="text-xs">*Valid only on 1 month booking</span>
            </div>
            <div>
              <Image src="/icons/logo.png" alt="logo" width={80} height={80} />
            </div>
          </CarouselItem>
          <CarouselItem className="md:basis-1/2 lg:basis-1/4 bg-[url('/assets/city-line-art.png')] bg-repeat-x bg-bottom bg-[#ffc107] bg-contain flex  p-4  h-[250px] mx-2">
            <div className="text-white flex-1">
              <h3>Instant Discount</h3>
              <h1 className="text-3xl font-bold">Gurgaon</h1>
              <div className="flex space-x-2 items-center mt-2">
                <span>500 off rent:</span>{" "}
                <div className="font-semibold p-1 rounded-md flex justify-center bg-white text-black">
                  PGGU500
                </div>
              </div>
              <span className="text-xs">*Valid only on 1 month booking</span>
            </div>
            <div>
              <Image src="/icons/logo.png" alt="logo" width={80} height={80} />
            </div>
          </CarouselItem>
          <CarouselItem className="md:basis-1/2 lg:basis-1/4 bg-[url('/assets/city-line-art.png')] bg-repeat-x bg-bottom bg-[#FF5733] bg-contain flex  p-4  h-[250px] mx-2">
            <div className="text-white flex-1">
              <h3>Instant Discount</h3>
              <h1 className="text-3xl font-bold">Gurgaon</h1>
              <div className="flex space-x-2 items-center mt-2">
                <span>500 off rent:</span>{" "}
                <div className="font-semibold p-1 rounded-md flex justify-center bg-white text-black">
                  PGGU500
                </div>
              </div>
              <span className="text-xs">*Valid only on 1 month booking</span>
            </div>
            <div>
              <Image src="/icons/logo.png" alt="logo" width={80} height={80} />
            </div>
          </CarouselItem>
          <CarouselItem className="md:basis-1/2 lg:basis-1/4 bg-[url('/assets/city-line-art.png')] bg-repeat-x bg-bottom bg-primary1 bg-contain flex  p-4  h-[250px] mx-2">
            <div className="text-white flex-1">
              <h3>Instant Discount</h3>
              <h1 className="text-3xl font-bold">Gurgaon</h1>
              <div className="flex space-x-2 items-center mt-2">
                <span>500 off rent:</span>{" "}
                <div className="font-semibold p-1 rounded-md flex justify-center bg-white text-black">
                  PGGU500
                </div>
              </div>
              <span className="text-xs">*Valid only on 1 month booking</span>
            </div>
            <div>
              <Image src="/icons/logo.png" alt="logo" width={80} height={80} />
            </div>
          </CarouselItem>
          <CarouselItem className="md:basis-1/2 lg:basis-1/4 bg-[url('/assets/city-line-art.png')] bg-repeat-x bg-bottom bg-[#ffc107] bg-contain flex  p-4  h-[250px] mx-2">
            <div className="text-white flex-1">
              <h3>Instant Discount</h3>
              <h1 className="text-3xl font-bold">Gurgaon</h1>
              <div className="flex space-x-2 items-center mt-2">
                <span>500 off rent:</span>{" "}
                <div className="font-semibold p-1 rounded-md flex justify-center bg-white text-black">
                  PGGU500
                </div>
              </div>
              <span className="text-xs">*Valid only on 1 month booking</span>
            </div>
            <div>
              <Image src="/icons/logo.png" alt="logo" width={80} height={80} />
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
      <div className="flex justify-center items-center h-full">
        <div className="flex justify-evenly space-x-10 mx-12 flex-col md:flex-row md:mx-44 lg:mx-72  mt-12">
          <div className="flex-1">
            <h1 className="text-primary1 text-3xl mb-4 font-medium">
              About PGConnect
            </h1>
            <div className="w-[80px] bg-[#019fe9] h-[4px] mb-4"></div>
            <p className="text-lg">
              We, at Book My PG, are India&lsquo;s fastest-growing network of
              managed Paying Guest (PG) rentals. We hope to provide you with the
              best renting solutions with the help of our designs and
              technology.Our services across the country will help you find and
              book Paying Guest (PG) rental homes.
            </p>
          </div>
          <div className="flex-1">
            <Image
              src="/assets/about.png"
              alt="logo"
              width={500}
              height={500}
              className=""
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default About;

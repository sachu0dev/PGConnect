import LocationInput from "../../components/specific/LocationInput";

const Page = () => {
  return (
    <div className="w-full ">
      <section className="min-h-[calc(100vh-69px)] w-full flex flex-col justify-between bg-[url('/assets/headline-bg.png')] bg-repeat-x bg-bottom">
        <div>
          <div className="w-full flex flex-col justify-center items-center  mt-12 mb-8">
            <h1 className="text-primary1 text-5xl mb-4 font-medium">
              Book PG Anywhere
            </h1>
            <p className="text-lg">
              India&lsquo;s Largest PG Network to Book your PG Online
            </p>
          </div>
          <div className="w-full flex flex-col justify-center items-center   mb-8 ">
            <LocationInput />
          </div>
        </div>
        {/* <Image
          className="w-full"
          src={"/assets/city-slider.png"}
          alt="city slider"
          width={2000}
          height={500}
        /> */}
      </section>
      {/* <section className="min-h-screen w-full flex flex-col justify-evenly ">
        <About />
      </section> */}
    </div>
  );
};

export default Page;

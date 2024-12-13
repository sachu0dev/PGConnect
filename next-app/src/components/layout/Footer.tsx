import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <div className="h-28 bg-primary1 flex justify-around items-center text-white">
      <div>Devloped with ❤️ by sushil kumar</div>
      <div className="grid grid-cols-2">
        <Link href="/t&c" className="hover:underline ">
          Terms & Conditions
        </Link>
        <Link href="/c&r" className="hover:underline ">
          Cancellation and Refund
        </Link>
        <Link href="/pp" className="hover:underline ">
          Privacy Policy
        </Link>
        <Link href="/s&d" className="hover:underline ">
          Shipping and Delivery
        </Link>
        <Link href="cu" className="hover:underline ">
          ContactUs
        </Link>
      </div>
      {/* <div>3</div> */}
    </div>
  );
};

export default Footer;

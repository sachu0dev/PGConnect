import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <div className="h-28 bg-primary1 flex justify-around items-center text-white">
      <div>Devloped with ❤️ by sushil kumar</div>
      <div className="flex space-x-6">
        <p>
          Contact Us on{" "}
          <Link
            href="mailto:contact@pgconnect.site"
            className="text-blue-700 pr-6  border-r border-white"
          >
            contact@pgconnect.site
          </Link>
        </p>
        <Link href="/terms" className="hover:underline ">
          Terms & Conditions
        </Link>
      </div>
      {/* <div>3</div> */}
    </div>
  );
};

export default Footer;

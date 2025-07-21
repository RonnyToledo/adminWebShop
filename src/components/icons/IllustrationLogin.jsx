import React from "react";
import Image from "next/image";

const IllustrationLogin = () => (
  <Image
    id={`login-img`}
    src={
      "https://res.cloudinary.com/dbgnyc842/image/upload/v1725399957/xmlctujxukncr5eurliu.png"
    }
    alt={"login-img`"}
    className={`w-1/2 group-hover:scale-105 transition-transform block object-cover z-[1] rounded-full`}
    height="500"
    width="500"
    style={{
      aspectRatio: "200/200",
      objectFit: "cover",
    }}
  />
);

export default IllustrationLogin;

import React from "react";
import Image from "next/image";
import { logoApp } from "@/utils/image";

const IllustrationLogin = () => (
  <Image
    id={`login-img`}
    src={logoApp}
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
